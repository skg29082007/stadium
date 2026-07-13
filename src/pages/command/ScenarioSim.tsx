import { useState, useMemo } from 'react';
import { useCrowdStore } from '../../stores/crowd-store';
import { useIncidentStore, selectActiveIncidents } from '../../stores/incident-store';
import { calculateRisk, type RiskAssessment } from '../../engine/risk-engine';
import { getRiskColor } from '../../utils/formatters';
import { hexToRgba } from '../../utils/colors';
import { Activity, Play, RotateCcw, Zap } from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  icon: string;
  description: string;
  impacts: {
    crowdModifier: number;    // add to avg density
    weatherModifier: number;  // set weather severity
    transitModifier: number;  // set transit load
    incidentCount: number;    // number of incidents to simulate
  };
}

const scenarios: Scenario[] = [
  {
    id: 'gate-closure', name: 'Gate B Emergency Closure', icon: '🚧',
    description: 'Gate B closed due to security alert. All fans rerouted to Gates A, C, D.',
    impacts: { crowdModifier: 20, weatherModifier: 0, transitModifier: 15, incidentCount: 2 },
  },
  {
    id: 'transit-delay', name: 'NJ Transit Major Delay', icon: '🚂',
    description: '45-minute delay on Meadowlands Rail Line. 12,000 fans delayed.',
    impacts: { crowdModifier: -10, weatherModifier: 0, transitModifier: 40, incidentCount: 1 },
  },
  {
    id: 'storm-warning', name: 'Thunderstorm Warning', icon: '⛈️',
    description: 'Severe thunderstorm approaching. Lightning within 5 miles.',
    impacts: { crowdModifier: 10, weatherModifier: 85, transitModifier: 25, incidentCount: 3 },
  },
  {
    id: 'medical-surge', name: 'Medical Surge (Heat)', icon: '🌡️',
    description: 'Heat index exceeds 105°F. Multiple heat-related incidents.',
    impacts: { crowdModifier: 5, weatherModifier: 60, transitModifier: 0, incidentCount: 5 },
  },
  {
    id: 'power-outage', name: 'Partial Power Outage', icon: '⚡',
    description: 'Power failure in West sector. Lights, displays, and elevators affected.',
    impacts: { crowdModifier: 15, weatherModifier: 0, transitModifier: 10, incidentCount: 4 },
  },
  {
    id: 'crowd-surge', name: 'Post-Goal Crowd Surge', icon: '⚽',
    description: 'Dramatic last-minute goal triggers massive crowd movement.',
    impacts: { crowdModifier: 25, weatherModifier: 0, transitModifier: 5, incidentCount: 2 },
  },
];

export default function ScenarioSim() {
  const snapshot = useCrowdStore((s) => s.snapshot);
  const incidents = useIncidentStore((s) => s.incidents);
  const activeIncidents = useMemo(() => selectActiveIncidents(incidents), [incidents]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [simResult, setSimResult] = useState<RiskAssessment | null>(null);
  const [baselineRisk, setBaselineRisk] = useState<RiskAssessment | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = () => {
    if (!selectedScenario || !snapshot) return;
    setIsSimulating(true);

    // Calculate baseline
    const baseline = calculateRisk(snapshot, activeIncidents);
    setBaselineRisk(baseline);

    // Simulate modified conditions
    setTimeout(() => {
      const modifiedSnapshot = {
        ...snapshot,
        avgDensity: Math.min(99, snapshot.avgDensity + selectedScenario.impacts.crowdModifier),
        zones: snapshot.zones.map(z => ({
          ...z,
          density: Math.min(99, z.density + selectedScenario.impacts.crowdModifier * (0.5 + Math.random() * 0.5)),
        })),
      };

      // Generate fake incidents
      const fakeIncidents = [...activeIncidents];
      for (let i = 0; i < selectedScenario.impacts.incidentCount; i++) {
        fakeIncidents.push({
          id: `sim-${i}`, category: 'CROWD', priority: i === 0 ? 'CRITICAL' as const : 'HIGH' as const,
          status: 'NEW' as const, title: 'Simulated', description: 'Simulated incident',
          zone: 'zone-n-lower', reportedBy: 'Simulator',
          reportedAt: Date.now(), updatedAt: Date.now(),
          aiSummary: '', suggestedAction: '', estimatedResponseMinutes: 5,
        });
      }

      const result = calculateRisk(
        modifiedSnapshot,
        fakeIncidents,
        selectedScenario.impacts.transitModifier + 50,
      );
      setSimResult(result);
      setIsSimulating(false);
    }, 800);
  };

  const resetSim = () => {
    setSimResult(null);
    setBaselineRisk(null);
    setSelectedScenario(null);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 4 }}>Scenario Simulator</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Test "what-if" disruptions and see projected risk impact with AI mitigation recommendations
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Scenario Selection */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16 }}>Select Scenario</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scenarios.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedScenario(s); setSimResult(null); }}
                style={{
                  padding: '14px 16px', borderRadius: 10, textAlign: 'left',
                  background: selectedScenario?.id === s.id ? 'rgba(108,92,231,0.12)' : 'var(--bg-tertiary)',
                  border: selectedScenario?.id === s.id ? '1px solid rgba(108,92,231,0.4)' : '1px solid transparent',
                  transition: 'all 0.2s ease', cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{s.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>{s.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Run Button */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={runSimulation}
              disabled={!selectedScenario || isSimulating}
              style={{ flex: 1, opacity: !selectedScenario ? 0.5 : 1 }}
            >
              {isSimulating ? (
                <span className="animate-pulse">Simulating...</span>
              ) : (
                <><Play size={16} /> Run Simulation</>
              )}
            </button>
            <button className="btn btn-ghost" onClick={resetSim}>
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16 }}>
            {simResult ? 'Simulation Results' : 'Results will appear here'}
          </h3>

          {simResult && baselineRisk ? (
            <div>
              {/* Side-by-side comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <ComparisonCard label="Current" score={baselineRisk.overallScore} level={baselineRisk.level} />
                <ComparisonCard label="Simulated" score={simResult.overallScore} level={simResult.level} highlight />
              </div>

              {/* Delta */}
              <div style={{
                padding: '12px 16px', borderRadius: 10, marginBottom: 16,
                background: simResult.overallScore > baselineRisk.overallScore ? 'rgba(239,83,80,0.08)' : 'rgba(0,210,160,0.08)',
                border: `1px solid ${simResult.overallScore > baselineRisk.overallScore ? 'rgba(239,83,80,0.2)' : 'rgba(0,210,160,0.2)'}`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Zap size={16} color={simResult.overallScore > baselineRisk.overallScore ? 'var(--color-danger)' : 'var(--color-success)'} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  Risk {simResult.overallScore > baselineRisk.overallScore ? 'increases' : 'decreases'} by{' '}
                  <span style={{ color: simResult.overallScore > baselineRisk.overallScore ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {Math.abs(simResult.overallScore - baselineRisk.overallScore)} points
                  </span>
                </span>
              </div>

              {/* Factor changes */}
              <div style={{ marginBottom: 16 }}>
                {simResult.factors.map((f, i) => {
                  const baseFactor = baselineRisk.factors[i];
                  const delta = f.score - baseFactor.score;
                  if (Math.abs(delta) < 2) return null;
                  return (
                    <div key={f.name} style={{
                      padding: '8px 12px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)',
                      display: 'flex', justifyContent: 'space-between',
                    }}>
                      <span>{f.icon} {f.name}</span>
                      <span style={{ color: delta > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                        {delta > 0 ? '+' : ''}{Math.round(delta)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* AI Recommendations */}
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase' }}>
                AI Mitigation Plan
              </div>
              {simResult.recommendations.map((rec, i) => (
                <div key={i} style={{
                  padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                  background: 'var(--bg-tertiary)',
                  borderLeft: '3px solid var(--color-primary)',
                  fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5,
                }}>
                  {rec}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              height: 300, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)',
            }}>
              <Activity size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              Select a scenario and click "Run Simulation"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComparisonCard({ label, score, level, highlight }: {
  label: string; score: number; level: string; highlight?: boolean;
}) {
  const color = getRiskColor(score);
  return (
    <div style={{
      padding: 16, borderRadius: 12, textAlign: 'center',
      background: highlight ? hexToRgba(color, 0.08) : 'var(--bg-tertiary)',
      border: highlight ? `1px solid ${hexToRgba(color, 0.3)}` : '1px solid transparent',
    }}>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 8 }}>{label}</div>
      <div className="mono" style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, color }}>{score}</div>
      <div className="badge" style={{
        background: hexToRgba(color, 0.15), color,
        marginTop: 8,
      }}>{level}</div>
    </div>
  );
}
