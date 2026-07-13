export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

export function formatPercent(n: number): string {
  return `${Math.round(n)}%`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatTimeShort(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export function getRiskColor(score: number): string {
  if (score <= 30) return '#00d2a0';
  if (score <= 55) return '#ffa726';
  if (score <= 80) return '#ff7043';
  return '#ef5350';
}

export function getRiskLabel(score: number): string {
  if (score <= 30) return 'Low';
  if (score <= 55) return 'Moderate';
  if (score <= 80) return 'High';
  return 'Critical';
}

export function getDensityColor(density: number): string {
  if (density <= 50) return '#00d2a0';
  if (density <= 75) return '#ffa726';
  if (density <= 85) return '#ff7043';
  return '#ef5350';
}

export function getDensityLabel(density: number): string {
  if (density <= 50) return 'Normal';
  if (density <= 75) return 'Moderate';
  if (density <= 85) return 'High';
  return 'Critical';
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
