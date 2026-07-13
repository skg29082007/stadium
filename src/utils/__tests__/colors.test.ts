import { describe, it, expect } from 'vitest';
import { lerpColor, densityToColor, hexToRgba } from '../colors';

describe('colors — lerpColor', () => {
  it('returns color a at t=0', () => {
    expect(lerpColor('#ff0000', '#0000ff', 0)).toBe('#ff0000');
  });

  it('returns color b at t=1', () => {
    expect(lerpColor('#ff0000', '#0000ff', 1)).toBe('#0000ff');
  });

  it('returns a blend at t=0.5', () => {
    const result = lerpColor('#ff0000', '#0000ff', 0.5);
    // Should be purple-ish: around #800080
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('handles identical colors', () => {
    expect(lerpColor('#abcdef', '#abcdef', 0.5)).toBe('#abcdef');
  });

  it('handles black to white', () => {
    const mid = lerpColor('#000000', '#ffffff', 0.5);
    expect(mid).toMatch(/^#[78][0-9a-f][78][0-9a-f][78][0-9a-f]$/);
  });
});

describe('colors — densityToColor', () => {
  it('returns green for low density', () => {
    const result = densityToColor(0);
    expect(result).toBe('#00d2a0');
  });

  it('returns red for maximum density', () => {
    const result = densityToColor(100);
    expect(result).toBe('#ef5350');
  });

  it('returns a valid hex color for mid values', () => {
    const result = densityToColor(50);
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('returns valid colors for all thresholds', () => {
    for (const density of [0, 25, 50, 70, 85, 100]) {
      const result = densityToColor(density);
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('colors — hexToRgba', () => {
  it('converts hex to rgba with given alpha', () => {
    expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('handles white', () => {
    expect(hexToRgba('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
  });

  it('handles black with zero alpha', () => {
    expect(hexToRgba('#000000', 0)).toBe('rgba(0, 0, 0, 0)');
  });

  it('handles arbitrary colors', () => {
    const result = hexToRgba('#6c5ce7', 0.12);
    expect(result).toMatch(/^rgba\(\d+, \d+, \d+, 0\.12\)$/);
  });
});
