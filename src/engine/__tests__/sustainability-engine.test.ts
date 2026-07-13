import { describe, it, expect } from 'vitest';
import { calculateSustainability, getCurrentSustainability } from '../sustainability-engine';

describe('sustainability engine', () => {
  it('calculates metrics correctly', () => {
    calculateSustainability(50000, 25);
    const metrics = getCurrentSustainability();
    expect(metrics).not.toBeNull();
    if (metrics) {
      expect(metrics.carbon.totalKgCO2).toBeGreaterThan(0);
      expect(metrics.waste.totalKg).toBeGreaterThan(0);
      expect(metrics.energy.totalKWh).toBeGreaterThan(0);
      expect(metrics.water.totalLiters).toBeGreaterThan(0);
    }
  });

  it('gets current sustainability', () => {
    const metrics = getCurrentSustainability();
    expect(metrics).not.toBeNull();
  });
});
