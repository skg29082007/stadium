import { useCrowdStore } from '../../stores/crowd-store';
import { stadiumZones } from '../../data/stadium-zones';
import { densityToColor, hexToRgba } from '../../utils/colors';
import { formatPercent } from '../../utils/formatters';
import {
  Users, TrendingUp, TrendingDown, Minus, AlertTriangle, Eye
} from 'lucide-react';
import { ResponsiveContainer, XAxis, Tooltip, AreaChart, Area } from 'recharts';
import { useRef, useEffect, useCallback } from 'react';
import GenAIInsights from '../../components/shared/GenAIInsights';

export default function CrowdAnalytics() {
  const snapshot = useCrowdStore((s) => s.snapshot);
  const predictions = useCrowdStore((s) => s.predictions);
  const history = useCrowdStore((s) => s.history);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const bottleneckZones = predictions.filter(p => p.bottleneckRisk);


  // Draw heatmap on canvas
  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !snapshot) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw stadium outline (ellipse)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(w/2, h/2, w*0.42, h*0.42, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Draw pitch rectangle in center
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(w*0.3, h*0.35, w*0.4, h*0.3);

    // Draw zone heatmap blobs
    stadiumZones.forEach(zone => {
      const zoneData = snapshot.zones.find(z => z.zoneId === zone.id);
      if (!zoneData) return;

      const cx = zone.centerX * w;
      const cy = zone.centerY * h;
      const radius = zone.level === 'lower' ? 40 : zone.level === 'mezzanine' ? 30 : 25;
      const color = densityToColor(zoneData.density);

      // Radial gradient
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, hexToRgba(color, 0.6));
      gradient.addColorStop(0.5, hexToRgba(color, 0.3));
      gradient.addColorStop(1, hexToRgba(color, 0));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Zone label
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(zoneData.density)}%`, cx, cy + 3);
    });

    // Draw gates
    const gates = [
      { label: 'A', x: 0.5, y: 0.04 },
      { label: 'B', x: 0.96, y: 0.5 },
      { label: 'C', x: 0.5, y: 0.96 },
      { label: 'D', x: 0.04, y: 0.5 },
    ];
    gates.forEach(g => {
      ctx.fillStyle = 'rgba(233, 180, 76, 0.8)';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`Gate ${g.label}`, g.x * w, g.y * h);
    });
  }, [snapshot]);

  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);

  // Historical chart data
  const chartData = history.slice(-60).map((s, i) => ({
    i,
    avg: Math.round(s.avgDensity),
    north: Math.round(s.zones.find(z => z.zoneId === 'zone-n-lower')?.density ?? 0),
    east: Math.round(s.zones.find(z => z.zoneId === 'zone-e-lower')?.density ?? 0),
    south: Math.round(s.zones.find(z => z.zoneId === 'zone-s-lower')?.density ?? 0),
    west: Math.round(s.zones.find(z => z.zoneId === 'zone-w-lower')?.density ?? 0),
  }));

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 4 }}>
          Crowd Analytics
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Real-time density monitoring and 15-minute predictive alerts
        </p>
      </div>

      {/* Bottleneck Alerts */}
      {bottleneckZones.length > 0 && (
        <div role="alert" aria-live="assertive" style={{
          padding: '14px 20px', borderRadius: 12, marginBottom: 20,
          background: 'rgba(239, 83, 80, 0.08)',
          border: '1px solid rgba(239, 83, 80, 0.2)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <AlertTriangle size={18} color="var(--color-danger)" />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger)', fontWeight: 600 }}>
            Bottleneck Risk: {bottleneckZones.map(b => b.zoneId.replace('zone-', '').replace(/-/g, ' ').toUpperCase()).join(', ')} — Predicted to exceed 85% in 15 min
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Live Heatmap */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={16} /> Live Stadium Heatmap
          </h3>
          <div style={{
            position: 'relative', background: 'var(--bg-primary)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            <canvas ref={canvasRef} width={440} height={440} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Live stadium heatmap showing crowd density by zone" />
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
            {[
              { label: 'Low', color: '#00d2a0' },
              { label: 'Moderate', color: '#ffa726' },
              { label: 'High', color: '#ff7043' },
              { label: 'Critical', color: '#ef5350' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Zone Detail Cards */}
        <div className="card" style={{ padding: 20, maxHeight: 520, overflowY: 'auto' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} /> Zone Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stadiumZones.map(zone => {
              const zd = snapshot?.zones.find(z => z.zoneId === zone.id);
              const pred = predictions.find(p => p.zoneId === zone.id);
              const density = zd?.density ?? 50;
              const color = densityToColor(density);
              const predDensity = pred?.predictedDensity ?? density;
              const predColor = densityToColor(predDensity);

              return (
                <div key={zone.id} style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'var(--bg-tertiary)',
                  border: pred?.bottleneckRisk ? `1px solid ${hexToRgba('#ef5350', 0.4)}` : '1px solid transparent',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{zone.name}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: 8 }}>
                        {zd?.count?.toLocaleString() ?? '—'} / {zone.capacity.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color }}>
                        {formatPercent(density)}
                      </span>
                      {zd?.trend === 'rising' ? <TrendingUp size={12} color={color} /> :
                       zd?.trend === 'falling' ? <TrendingDown size={12} color={color} /> :
                       <Minus size={12} color="var(--text-tertiary)" />}
                    </div>
                  </div>
                  {/* Density bar */}
                  <div style={{ height: 4, background: 'var(--bg-primary)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${density}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
                  </div>
                  {/* Prediction */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    <span>Predicted (15min): <span style={{ color: predColor, fontWeight: 600 }}>{formatPercent(predDensity)}</span></span>
                    {pred?.bottleneckRisk && (
                      <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>⚠ BOTTLENECK RISK</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* GenAI Operational Insights */}
      <GenAIInsights 
        context="crowd" 
        metrics={{
          avgDensity: Math.round(snapshot?.avgDensity || 0),
          activeZones: snapshot?.zones ? Object.keys(snapshot.zones).length : 0
        }} 
      />

      {/* Trend Chart */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16 }}>
          📈 Density Trend by Quadrant (Lower Bowl)
        </h3>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis dataKey="i" hide />
              <Tooltip
                contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 11 }}
                labelFormatter={() => ''}
              />
              <Area type="monotone" dataKey="north" stroke="#6c5ce7" fill="rgba(108,92,231,0.1)" strokeWidth={1.5} name="North" />
              <Area type="monotone" dataKey="east" stroke="#00cec9" fill="rgba(0,206,201,0.1)" strokeWidth={1.5} name="East" />
              <Area type="monotone" dataKey="south" stroke="#fdcb6e" fill="rgba(253,203,110,0.1)" strokeWidth={1.5} name="South" />
              <Area type="monotone" dataKey="west" stroke="#e17055" fill="rgba(225,112,85,0.1)" strokeWidth={1.5} name="West" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
