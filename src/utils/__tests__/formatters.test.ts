import { describe, it, expect } from 'vitest';
import {
  formatNumber, formatPercent, formatDuration, formatTime, formatTimeShort,
  getRiskColor, getRiskLabel, getDensityColor, getDensityLabel,
  clamp, lerp, generateId,
} from '../formatters';

describe('formatters — formatNumber', () => {
  it('formats thousands with commas', () => {
    expect(formatNumber(80663)).toBe('80,663');
  });

  it('rounds to nearest integer', () => {
    expect(formatNumber(3.7)).toBe('4');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatters — formatPercent', () => {
  it('formats with percent sign', () => {
    expect(formatPercent(85)).toBe('85%');
  });

  it('rounds decimal values', () => {
    expect(formatPercent(72.6)).toBe('73%');
  });
});

describe('formatters — formatDuration', () => {
  it('returns "< 1 min" for very short durations', () => {
    expect(formatDuration(0.5)).toBe('< 1 min');
  });

  it('formats minutes', () => {
    expect(formatDuration(5)).toBe('5 min');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
  });

  it('formats exact hours', () => {
    expect(formatDuration(120)).toBe('2h');
  });
});

describe('formatters — formatTime', () => {
  it('formats date as 12-hour time', () => {
    const result = formatTime(new Date('2026-06-15T14:30:00'));
    expect(result).toMatch(/\d{2}:\d{2}\s?(AM|PM)/i);
  });
});

describe('formatters — formatTimeShort', () => {
  it('formats date as 24-hour time with seconds', () => {
    const result = formatTimeShort(new Date('2026-06-15T14:30:15'));
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});

describe('formatters — risk helpers', () => {
  it('getRiskColor returns green for low scores', () => {
    expect(getRiskColor(20)).toBe('#00d2a0');
  });

  it('getRiskColor returns red for critical scores', () => {
    expect(getRiskColor(90)).toBe('#ef5350');
  });

  it('getRiskLabel returns correct labels', () => {
    expect(getRiskLabel(20)).toBe('Low');
    expect(getRiskLabel(50)).toBe('Moderate');
    expect(getRiskLabel(70)).toBe('High');
    expect(getRiskLabel(95)).toBe('Critical');
  });
});

describe('formatters — density helpers', () => {
  it('getDensityColor returns green for normal', () => {
    expect(getDensityColor(30)).toBe('#00d2a0');
  });

  it('getDensityColor returns red for critical', () => {
    expect(getDensityColor(90)).toBe('#ef5350');
  });

  it('getDensityLabel returns correct labels', () => {
    expect(getDensityLabel(30)).toBe('Normal');
    expect(getDensityLabel(60)).toBe('Moderate');
    expect(getDensityLabel(80)).toBe('High');
    expect(getDensityLabel(95)).toBe('Critical');
  });
});

describe('formatters — clamp', () => {
  it('clamps value below min', () => {
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  it('clamps value above max', () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it('returns value within range', () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it('handles equal min and max', () => {
    expect(clamp(50, 10, 10)).toBe(10);
  });
});

describe('formatters — lerp', () => {
  it('returns a at t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it('returns b at t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it('returns midpoint at t=0.5', () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });
});

describe('formatters — generateId', () => {
  it('generates a non-empty string', () => {
    expect(generateId()).toBeTruthy();
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
