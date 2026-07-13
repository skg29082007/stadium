import { describe, it, expect } from 'vitest';
import { calculateRisk, getRiskHistory } from '../risk-engine';
import type { CrowdSnapshot } from '../../data/crowd-simulator';
import type { Incident } from '../incident-triage';

function makeCrowdSnapshot(avgDensity: number): CrowdSnapshot {
  return {
    timestamp: Date.now(),
    matchPhase: 'first-half',
    matchMinute: 30,
    totalAttendance: 50000,
    avgDensity,
    zones: [
      { zoneId: 'zone-n-lower', density: avgDensity, count: 3000, trend: 'stable', timestamp: Date.now() },
      { zoneId: 'zone-e-lower', density: avgDensity + 5, count: 3200, trend: 'rising', timestamp: Date.now() },
    ],
  };
}

function makeIncident(priority: Incident['priority']): Incident {
  return {
    id: `test-${Date.now()}-${Math.random()}`,
    category: 'MEDICAL',
    priority,
    status: 'NEW',
    title: 'Test Incident',
    description: 'Test description',
    zone: 'zone-n-lower',
    reportedBy: 'Test',
    reportedAt: Date.now(),
    updatedAt: Date.now(),
    aiSummary: 'Test summary',
    suggestedAction: 'Test action',
    estimatedResponseMinutes: 5,
  };
}

describe('risk-engine — calculateRisk', () => {
  it('returns a valid risk assessment with score 0-100', () => {
    const risk = calculateRisk(makeCrowdSnapshot(50), []);
    expect(risk.overallScore).toBeGreaterThanOrEqual(0);
    expect(risk.overallScore).toBeLessThanOrEqual(100);
    expect(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).toContain(risk.level);
    expect(risk.factors).toHaveLength(5);
    expect(risk.summary).toBeTruthy();
    expect(risk.recommendations.length).toBeGreaterThan(0);
    expect(risk.timestamp).toBeGreaterThan(0);
  });

  it('assigns LOW level for low crowd density', () => {
    const risk = calculateRisk(makeCrowdSnapshot(20), []);
    expect(risk.level).toBe('LOW');
  });

  it('assigns higher risk when critical incidents exist', () => {
    const noIncidents = calculateRisk(makeCrowdSnapshot(50), []);
    const withCritical = calculateRisk(makeCrowdSnapshot(50), [
      makeIncident('CRITICAL'),
      makeIncident('CRITICAL'),
    ]);
    expect(withCritical.overallScore).toBeGreaterThan(noIncidents.overallScore);
  });

  it('has correct factor weights summing to 1.0', () => {
    const risk = calculateRisk(makeCrowdSnapshot(50), []);
    const totalWeight = risk.factors.reduce((sum, f) => sum + f.weight, 0);
    expect(totalWeight).toBeCloseTo(1.0, 5);
  });

  it('includes all 5 risk factors', () => {
    const risk = calculateRisk(makeCrowdSnapshot(50), []);
    const names = risk.factors.map(f => f.name);
    expect(names).toContain('Crowd Density');
    expect(names).toContain('Weather');
    expect(names).toContain('Transit Load');
    expect(names).toContain('Incidents');
    expect(names).toContain('Match Rivalry');
  });

  it('generates recommendations for high crowd density', () => {
    const risk = calculateRisk(makeCrowdSnapshot(90), []);
    expect(risk.recommendations.length).toBeGreaterThan(0);
  });

  it('handles null crowd data gracefully', () => {
    const risk = calculateRisk(null, []);
    expect(risk.overallScore).toBeGreaterThanOrEqual(0);
    expect(risk.level).toBeTruthy();
  });
});

describe('risk-engine — getRiskHistory', () => {
  it('returns an array of historical scores', () => {
    // Generate some history
    calculateRisk(makeCrowdSnapshot(50), []);
    calculateRisk(makeCrowdSnapshot(60), []);
    const history = getRiskHistory();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    history.forEach(score => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
