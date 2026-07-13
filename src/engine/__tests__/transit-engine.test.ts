import { describe, it, expect } from 'vitest';
import { getTransitOptions, getParkingLots, getStaggeredDepartureSuggestion, getTransitRecommendation } from '../transit-engine';

describe('transit engine', () => {
  it('returns transit options', () => {
    const options = getTransitOptions();
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].type).toBeDefined();
  });

  it('returns parking lots', () => {
    const lots = getParkingLots();
    expect(lots.length).toBeGreaterThan(0);
    expect(lots[0].occupancy).toBeDefined();
  });

  it('gets staggered departure suggestion', () => {
    expect(getStaggeredDepartureSuggestion(45)).toContain('Match in progress');
    expect(getStaggeredDepartureSuggestion(80)).toBeDefined();
  });

  it('gets transit recommendation', () => {
    expect(getTransitRecommendation({'NJ Transit': 90})).toBeDefined();
  });
});
