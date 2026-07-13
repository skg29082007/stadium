import { describe, it, expect } from 'vitest';
import { stadiumZones, getZoneById, getZoneForSection, getZonesByQuadrant, getTotalCapacity } from '../stadium-zones';

describe('stadium-zones', () => {
  it('has 12 zones (4 quadrants × 3 levels)', () => {
    expect(stadiumZones).toHaveLength(12);
  });

  it('every zone has required fields', () => {
    for (const zone of stadiumZones) {
      expect(zone.id).toBeTruthy();
      expect(zone.name).toBeTruthy();
      expect(['north', 'east', 'south', 'west']).toContain(zone.quadrant);
      expect(['lower', 'mezzanine', 'upper']).toContain(zone.level);
      expect(zone.capacity).toBeGreaterThan(0);
      expect(zone.sections.length).toBeGreaterThan(0);
      expect(zone.centerX).toBeGreaterThanOrEqual(0);
      expect(zone.centerX).toBeLessThanOrEqual(1);
      expect(zone.centerY).toBeGreaterThanOrEqual(0);
      expect(zone.centerY).toBeLessThanOrEqual(1);
    }
  });

  it('getZoneById finds valid zones', () => {
    expect(getZoneById('zone-n-lower')).toBeDefined();
    expect(getZoneById('zone-n-lower')!.name).toBe('North Lower');
  });

  it('getZoneById returns undefined for invalid ID', () => {
    expect(getZoneById('invalid')).toBeUndefined();
  });

  it('getZoneForSection maps sections to correct zones', () => {
    const zone = getZoneForSection('sec-101');
    expect(zone).toBeDefined();
    expect(zone!.quadrant).toBe('north');
    expect(zone!.level).toBe('lower');
  });

  it('getZoneForSection returns undefined for non-existent section', () => {
    expect(getZoneForSection('sec-999')).toBeUndefined();
  });

  it('all sections across all zones are unique (no duplicates)', () => {
    const allSections = stadiumZones.flatMap(z => z.sections);
    const uniqueSections = new Set(allSections);
    expect(uniqueSections.size).toBe(allSections.length);
  });

  it('getZonesByQuadrant returns correct zones', () => {
    const northZones = getZonesByQuadrant('north');
    expect(northZones).toHaveLength(3); // lower, mezz, upper
    northZones.forEach(z => expect(z.quadrant).toBe('north'));
  });

  it('getTotalCapacity returns the sum of all zone capacities', () => {
    const total = getTotalCapacity();
    const expected = stadiumZones.reduce((sum, z) => sum + z.capacity, 0);
    expect(total).toBe(expected);
    expect(total).toBeGreaterThan(0);
  });
});
