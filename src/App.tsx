import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAppStore } from './stores/app-store';
import { useCrowdStore } from './stores/crowd-store';
import { useIncidentStore } from './stores/incident-store';
import { CROWD_UPDATE_INTERVAL } from './utils/constants';

import Landing from './pages/Landing';
import CommandCenter from './pages/command/CommandCenter';
import CrowdAnalytics from './pages/command/CrowdAnalytics';
import RiskDashboard from './pages/command/RiskDashboard';
import ScenarioSim from './pages/command/ScenarioSim';
import IncidentManager from './pages/command/IncidentManager';
import SustainabilityDashboard from './pages/command/SustainabilityDashboard';
import FanHome from './pages/fan/FanHome';
import FanNavigation from './pages/fan/FanNavigation';
import StaffDashboard from './pages/staff/StaffDashboard';
import AppShell from './components/layout/AppShell';

export default function App() {
  const theme = useAppStore((s) => s.theme);
  const matchPhase = useAppStore((s) => s.matchPhase);
  const updateCrowd = useCrowdStore((s) => s.updateCrowd);
  const addRandomIncident = useIncidentStore((s) => s.addRandomIncident);

  // Use refs to avoid dependency loops — the interval reads the latest
  // values without needing to restart on every matchMinute change.
  const matchMinuteRef = useRef(useAppStore.getState().matchMinute);
  const matchPhaseRef = useRef(matchPhase);
  matchPhaseRef.current = matchPhase;

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Real-time crowd simulation loop — stable interval, no dependency on matchMinute
  useEffect(() => {
    // Initial update
    updateCrowd(matchPhaseRef.current, matchMinuteRef.current);

    const interval = setInterval(() => {
      matchMinuteRef.current += 1;
      useAppStore.getState().setMatchMinute(matchMinuteRef.current);
      updateCrowd(matchPhaseRef.current, matchMinuteRef.current);
    }, CROWD_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [updateCrowd]);

  // Restart the loop if matchPhase changes (user picks a new phase)
  useEffect(() => {
    matchPhaseRef.current = matchPhase;
  }, [matchPhase]);

  // Random incident generator (every 8-15 seconds)
  useEffect(() => {
    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 7000;
      return setTimeout(() => {
        addRandomIncident();
        timerRef = scheduleNext();
      }, delay);
    };
    let timerRef = scheduleNext();
    return () => clearTimeout(timerRef);
  }, [addRandomIncident]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<AppShell />}>
        <Route path="/command" element={<CommandCenter />} />
        <Route path="/command/crowd" element={<CrowdAnalytics />} />
        <Route path="/command/risk" element={<RiskDashboard />} />
        <Route path="/command/scenarios" element={<ScenarioSim />} />
        <Route path="/command/incidents" element={<IncidentManager />} />
        <Route path="/command/sustainability" element={<SustainabilityDashboard />} />
        <Route path="/staff" element={<StaffDashboard />} />
      </Route>
      <Route path="/fan" element={<FanHome />} />
      <Route path="/fan/navigate" element={<FanNavigation />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
