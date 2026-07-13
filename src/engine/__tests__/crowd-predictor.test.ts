import { describe, it, expect, beforeEach } from 'vitest';
import { predictDensity, getBottleneckAlerts, getHighRiskZones, resetPredictorHistory } from '../crowd-predictor';
import type { ZoneDensity } from '../../data/crowd-simulator';

function makeZones(density: number): ZoneDensity[] {
  return [
    { zoneId: 'zone-n-lower', density, count: Math.round(density * 40), trend: 'stable', timestamp: Date.now() },
    { zoneId: 'zone-e-lower', density, count: Math.round(density * 40), trend: 'stable', timestamp: Date.now() },
    { zoneId: 'zone-s-lower', density: density * 0.8, count: Math.round(density * 32), trend: 'stable', timestamp: Date.now() },
  ];
}

describe('crowd-predictor — predictDensity', () => {
  beforeEach(() => {
    resetPredictorHistory();
  });

  it('returns predictions for every input zone', () => {
    const zones = makeZones(60);
    const predictions = predictDensity(zones, 'first-half');
    expect(predictions).toHaveLength(zones.length);
    predictions.forEach(p => {
      expect(p.zoneId).toBeTruthy();
      expect(p.currentDensity).toBeGreaterThanOrEqual(0);
      expect(p.predictedDensity).toBeGreaterThanOrEqual(5);
      expect(p.predictedDensity).toBeLessThanOrEqual(99);
      expect(p.confidence).toBeGreaterThanOrEqual(0.3);
      expect(p.confidence).toBeLessThanOrEqual(0.95);
      expect(['rising', 'falling', 'stable']).toContain(p.trend);
      expect(['normal', 'warning', 'critical']).toContain(p.alertLevel);
    });
  });

  it('predicts lower density for post-match phase', () => {
    const zones = makeZones(70);
    const firstHalf = predictDensity(zones, 'first-half');
    resetPredictorHistory();
    const postMatch = predictDensity(zones, 'post-match');
    // Post-match has -15 phase boost vs +2 for first-half
    const avgFirst = firstHalf.reduce((s, p) => s + p.predictedDensity, 0) / firstHalf.length;
    const avgPost = postMatch.reduce((s, p) => s + p.predictedDensity, 0) / postMatch.length;
    expect(avgPost).toBeLessThan(avgFirst);
  });

  it('clamps predictions between 5 and 99', () => {
    const lowZones = makeZones(5);
    const preds = predictDensity(lowZones, 'post-match');
    preds.forEach(p => {
      expect(p.predictedDensity).toBeGreaterThanOrEqual(5);
      expect(p.predictedDensity).toBeLessThanOrEqual(99);
    });
  });

  it('increases confidence with more history', () => {
    const zones = makeZones(60);
    const first = predictDensity(zones, 'first-half');
    // Feed more data
    for (let i = 0; i < 30; i++) {
      predictDensity(zones, 'first-half');
    }
    const later = predictDensity(zones, 'first-half');
    expect(later[0].confidence).toBeGreaterThanOrEqual(first[0].confidence);
  });
});

describe('crowd-predictor — getBottleneckAlerts', () => {
  beforeEach(() => {
    resetPredictorHistory();
  });

  it('returns empty array for normal density', () => {
    const zones = makeZones(40);
    const preds = predictDensity(zones, 'first-half');
    const alerts = getBottleneckAlerts(preds);
    expect(alerts).toHaveLength(0);
  });
});

describe('crowd-predictor — getHighRiskZones', () => {
  beforeEach(() => {
    resetPredictorHistory();
  });

  it('returns zones with warning or critical alert level', () => {
    const zones = makeZones(92);
    const preds = predictDensity(zones, 'first-half');
    const highRisk = getHighRiskZones(preds);
    highRisk.forEach(z => {
      expect(['warning', 'critical']).toContain(z.alertLevel);
    });
  });
});
