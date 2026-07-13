/** Interpolate between two hex colors */
export function lerpColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.replace('#', ''), 16);
  const bh = parseInt(b.replace('#', ''), 16);

  const ar = (ah >> 16) & 0xff;
  const ag = (ah >> 8) & 0xff;
  const ab = ah & 0xff;

  const br = (bh >> 16) & 0xff;
  const bg = (bh >> 8) & 0xff;
  const bb = bh & 0xff;

  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);

  return `#${((rr << 16) | (rg << 8) | rb).toString(16).padStart(6, '0')}`;
}

/** Get heatmap color for a density value 0-100 */
export function densityToColor(density: number): string {
  const stops = [
    { val: 0, color: '#00d2a0' },    // green
    { val: 50, color: '#4ecdc4' },   // teal
    { val: 70, color: '#ffa726' },   // orange
    { val: 85, color: '#ff7043' },   // deep orange
    { val: 100, color: '#ef5350' },  // red
  ];

  for (let i = 0; i < stops.length - 1; i++) {
    if (density <= stops[i + 1].val) {
      const t = (density - stops[i].val) / (stops[i + 1].val - stops[i].val);
      return lerpColor(stops[i].color, stops[i + 1].color, t);
    }
  }
  return stops[stops.length - 1].color;
}

/** Convert hex to rgba */
export function hexToRgba(hex: string, alpha: number): string {
  const h = parseInt(hex.replace('#', ''), 16);
  const r = (h >> 16) & 0xff;
  const g = (h >> 8) & 0xff;
  const b = h & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
