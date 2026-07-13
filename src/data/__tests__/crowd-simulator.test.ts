import { describe, it, expect, beforeEach } from 'vitest';
import { generateCrowdSnapshot, getZoneDensity, resetSimulator } from '../crowd-simulator';

describe('crowd-simulator — generateCrowdSnapshot', () => {
  beforeEach(() => {
    resetSimulator();
  });

  it('generates a valid snapshot with all zones', () => {
    const snapshot = generateCrowdSnapshot('first-half', 30);
    expect(snapshot.timestamp).toBeGreaterThan(0);
    expect(snapshot.matchPhase).toBe('first-half');
    expect(snapshot.matchMinute).toBe(30);
    expect(snapshot.totalAttendance).toBeGreaterThan(0);
    expect(snapshot.zones.length).toBeGreaterThanOrEqual(12);
    expect(snapshot.avgDensity).toBeGreaterThan(0);
  });

  it('all zone densities are within 0-100', () => {
    const snapshot = generateCrowdSnapshot('first-half', 45);
    snapshot.zones.forEach(z => {
      expect(z.density).toBeGreaterThanOrEqual(0);
      expect(z.density).toBeLessThanOrEqual(100);
    });
  });

  it('zone counts are positive', () => {
    const snapshot = generateCrowdSnapshot('pre-match', 10);
    snapshot.zones.forEach(z => {
      expect(z.count).toBeGreaterThanOrEqual(0);
    });
  });

  it('zones have valid trend values', () => {
    const snapshot = generateCrowdSnapshot('halftime', 50);
    snapshot.zones.forEach(z => {
      expect(['rising', 'falling', 'stable']).toContain(z.trend);
    });
  });

  it('avgDensity is the average of all zone densities', () => {
    const snapshot = generateCrowdSnapshot('first-half', 25);
    const calculated = snapshot.zones.reduce((s, z) => s + z.density, 0) / snapshot.zones.length;
    expect(Math.abs(snapshot.avgDensity - calculated)).toBeLessThan(1);
  });

  it('produces different densities for different phases', () => {
    const preMatch = generateCrowdSnapshot('pre-match', 10);
    resetSimulator();
    const secondHalf = generateCrowdSnapshot('second-half', 70);
    // Second half should generally have higher density target
    expect(secondHalf.avgDensity).not.toBe(preMatch.avgDensity);
  });
});

describe('crowd-simulator — getZoneDensity', () => {
  beforeEach(() => {
    resetSimulator();
  });

  it('returns 0 before simulation starts', () => {
    expect(getZoneDensity('zone-n-lower')).toBe(0);
  });

  it('returns a value after simulation runs', () => {
    generateCrowdSnapshot('first-half', 30);
    const density = getZoneDensity('zone-n-lower');
    expect(density).toBeGreaterThan(0);
  });
});

describe('crowd-simulator — resetSimulator', () => {
  it('clears all state', () => {
    generateCrowdSnapshot('first-half', 30);
    expect(getZoneDensity('zone-n-lower')).toBeGreaterThan(0);
    resetSimulator();
    expect(getZoneDensity('zone-n-lower')).toBe(0);
  });
});
