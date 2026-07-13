/**
 * Crowd Density Simulator
 * Generates realistic crowd density per zone every tick.
 * Simulates match-day arrival/departure waves.
 */

import type { MatchPhase } from '../utils/constants';

export interface ZoneDensity {
  zoneId: string;
  density: number; // 0-100 percentage of capacity
  count: number; // approximate head count
  trend: 'rising' | 'falling' | 'stable';
  timestamp: number;
}

export interface CrowdSnapshot {
  timestamp: number;
  matchPhase: MatchPhase;
  matchMinute: number;
  totalAttendance: number;
  zones: ZoneDensity[];
  avgDensity: number;
}

// Zone capacities
const zoneCapacities: Record<string, number> = {
  'zone-n-lower': 4000, 'zone-n-mezz': 2400, 'zone-n-upper': 2000,
  'zone-e-lower': 4000, 'zone-e-mezz': 2400, 'zone-e-upper': 2000,
  'zone-s-lower': 4000, 'zone-s-mezz': 2400, 'zone-s-upper': 2000,
  'zone-w-lower': 4000, 'zone-w-mezz': 2400, 'zone-w-upper': 2000,
};

// Phase-based density targets (what % of capacity we aim for)
const phaseTargets: Record<MatchPhase, { base: number; variance: number }> = {
  'pre-match': { base: 45, variance: 20 },
  'first-half': { base: 88, variance: 8 },
  'halftime': { base: 65, variance: 15 },
  'second-half': { base: 90, variance: 6 },
  'post-match': { base: 30, variance: 25 },
};

// Persistent per-zone state for smooth transitions
const zoneDensities: Record<string, number> = {};
const zoneTargets: Record<string, number> = {};
let initialized = false;

function initializeZones(): void {
  Object.keys(zoneCapacities).forEach(zoneId => {
    zoneDensities[zoneId] = 20 + Math.random() * 20;
    zoneTargets[zoneId] = zoneDensities[zoneId];
  });
  initialized = true;
}

function updateTargets(phase: MatchPhase): void {
  const { base, variance } = phaseTargets[phase];
  Object.keys(zoneCapacities).forEach(zoneId => {
    // Add zone-specific characteristics
    const levelBoost = zoneId.includes('lower') ? 5 : zoneId.includes('mezz') ? 0 : -5;
    const quadrantNoise = Math.sin(Date.now() / 30000 + zoneId.charCodeAt(5)) * 8;
    
    zoneTargets[zoneId] = Math.max(5, Math.min(100,
      base + levelBoost + quadrantNoise + (Math.random() - 0.5) * variance
    ));
  });
}

export function generateCrowdSnapshot(phase: MatchPhase, matchMinute: number): CrowdSnapshot {
  if (!initialized) initializeZones();
  
  updateTargets(phase);
  
  const zones: ZoneDensity[] = [];
  let totalCount = 0;

  Object.keys(zoneCapacities).forEach(zoneId => {
    const target = zoneTargets[zoneId];
    const current = zoneDensities[zoneId];
    
    // Smooth interpolation toward target (with noise)
    const speed = 0.08 + Math.random() * 0.04;
    const noise = (Math.random() - 0.5) * 3;
    const newDensity = Math.max(2, Math.min(99, current + (target - current) * speed + noise));
    
    zoneDensities[zoneId] = newDensity;
    
    const count = Math.round((newDensity / 100) * zoneCapacities[zoneId]);
    totalCount += count;
    
    const diff = newDensity - current;
    const trend: ZoneDensity['trend'] = Math.abs(diff) < 0.5 ? 'stable' : diff > 0 ? 'rising' : 'falling';
    
    zones.push({
      zoneId,
      density: Math.round(newDensity * 10) / 10,
      count,
      trend,
      timestamp: Date.now(),
    });
  });

  const avgDensity = zones.reduce((s, z) => s + z.density, 0) / zones.length;

  return {
    timestamp: Date.now(),
    matchPhase: phase,
    matchMinute,
    totalAttendance: totalCount,
    zones,
    avgDensity: Math.round(avgDensity * 10) / 10,
  };
}

export function getZoneDensity(zoneId: string): number {
  return zoneDensities[zoneId] ?? 0;
}

export function resetSimulator(): void {
  initialized = false;
  Object.keys(zoneDensities).forEach(k => delete zoneDensities[k]);
  Object.keys(zoneTargets).forEach(k => delete zoneTargets[k]);
}
