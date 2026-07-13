import { useCrowdStore } from '../../stores/crowd-store';
import { calculateSustainability, type SustainabilityMetrics } from '../../engine/sustainability-engine';
import { useEffect, useState } from 'react';
import { Leaf, Droplets, Zap, Recycle, TrendingDown, Award } from 'lucide-react';
import { hexToRgba } from '../../utils/colors';

export default function SustainabilityDashboard() {
  const snapshot = useCrowdStore((s) => s.snapshot);
  const [metrics, setMetrics] = useState<SustainabilityMetrics | null>(null);

  useEffect(() => {
    if (snapshot) {
      const m = calculateSustainability(snapshot.totalAttendance, snapshot.matchMinute);
      setMetrics(m);
    }
  }, [snapshot]);

  if (!metrics) {
    return (
      <div className="animate-fade-in" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Loading sustainability metrics...
      </div>
    );
  }

  const scoreColor = metrics.overallScore >= 70 ? '#00d2a0' : metrics.overallScore >= 40 ? '#ffa726' : '#ef5350';

  return (
    <div className="animate-fade-in" role="main" aria-label="Sustainability dashboard">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Leaf size={24} color="#00d2a0" aria-hidden="true" /> Sustainability Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Real-time environmental impact monitoring — FIFA World Cup 2026 Green Initiative
        </p>
      </div>

      {/* Score + Top Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <SustainabilityCard
          label="Sustainability Score"
          value={`${metrics.overallScore}`}
          suffix="/100"
          icon={<Award size={18} aria-hidden="true" />}
          color={scoreColor}
          badge={metrics.overallScore >= 70 ? 'EXCELLENT' : metrics.overallScore >= 40 ? 'MODERATE' : 'NEEDS WORK'}
        />
        <SustainabilityCard
          label="Waste Diversion"
          value={`${metrics.waste.diversionRate}`}
          suffix="%"
          icon={<Recycle size={18} aria-hidden="true" />}
          color={metrics.waste.diversionRate >= 50 ? '#00d2a0' : '#ffa726'}
          badge={`${metrics.waste.recycledKg + metrics.waste.compostedKg} kg diverted`}
        />
        <SustainabilityCard
          label="Renewable Energy"
          value={`${metrics.energy.renewablePercent}`}
          suffix="%"
          icon={<Zap size={18} aria-hidden="true" />}
          color={metrics.energy.renewablePercent >= 40 ? '#00d2a0' : '#ffa726'}
          badge={`${metrics.energy.renewableKWh.toLocaleString()} kWh`}
        />
        <SustainabilityCard
          label="Water Recycled"
          value={`${Math.round((metrics.water.recycledLiters / Math.max(metrics.water.totalLiters, 1)) * 100)}`}
          suffix="%"
          icon={<Droplets size={18} aria-hidden="true" />}
          color="#42a5f5"
          badge={`${metrics.water.perCapitaLiters}L per fan`}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Carbon Footprint */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingDown size={16} aria-hidden="true" /> Carbon Footprint
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <CarbonBar label="Transit" value={metrics.carbon.transitKgCO2} max={metrics.carbon.totalKgCO2} color="#6c5ce7" />
            <CarbonBar label="Energy" value={metrics.carbon.energyKgCO2} max={metrics.carbon.totalKgCO2} color="#ffa726" />
            <CarbonBar label="Waste" value={metrics.carbon.wasteKgCO2} max={metrics.carbon.totalKgCO2} color="#ef5350" />
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                <span>Total: {metrics.carbon.totalKgCO2.toLocaleString()} kg CO₂</span>
                <span style={{ color: '#00d2a0' }}>Offset: -{metrics.carbon.offsetKgCO2.toLocaleString()} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', fontWeight: 700, marginTop: 4 }}>
                <span>Net Emissions:</span>
                <span className="mono" style={{ color: '#ffa726' }}>{metrics.carbon.netKgCO2.toLocaleString()} kg CO₂</span>
              </div>
            </div>
          </div>
        </div>

        {/* Waste Breakdown */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Recycle size={16} aria-hidden="true" /> Waste Management
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <WasteBar label="♻️ Recycled" value={metrics.waste.recycledKg} total={metrics.waste.totalKg} color="#00d2a0" />
            <WasteBar label="🌿 Composted" value={metrics.waste.compostedKg} total={metrics.waste.totalKg} color="#2ecc71" />
            <WasteBar label="🗑️ Landfill" value={metrics.waste.landfillKg} total={metrics.waste.totalKg} color="#ef5350" />
          </div>
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'var(--bg-tertiary)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            📊 Total waste: {metrics.waste.totalKg.toLocaleString()} kg · Diversion rate: <span style={{ color: metrics.waste.diversionRate >= 50 ? '#00d2a0' : '#ffa726', fontWeight: 700 }}>{metrics.waste.diversionRate}%</span>
          </div>
        </div>
      </div>

      {/* Energy Breakdown */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} aria-hidden="true" /> Energy Consumption
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Lighting', value: metrics.energy.lightingKWh, icon: '💡', pct: Math.round((metrics.energy.lightingKWh / Math.max(metrics.energy.totalKWh, 1)) * 100) },
            { label: 'HVAC', value: metrics.energy.hvacKWh, icon: '❄️', pct: Math.round((metrics.energy.hvacKWh / Math.max(metrics.energy.totalKWh, 1)) * 100) },
            { label: 'Displays', value: metrics.energy.displaysKWh, icon: '📺', pct: Math.round((metrics.energy.displaysKWh / Math.max(metrics.energy.totalKWh, 1)) * 100) },
          ].map(item => (
            <div key={item.label} style={{ padding: '14px', borderRadius: 10, background: 'var(--bg-tertiary)', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>{item.label}</div>
              <div className="mono" style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{item.value.toLocaleString()}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>kWh ({item.pct}%)</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Leaf size={16} aria-hidden="true" /> AI Sustainability Recommendations
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role="list" aria-label="Sustainability recommendations">
          {metrics.recommendations.map((rec, i) => (
            <div key={i} role="listitem" style={{
              padding: '12px 16px', borderRadius: 10,
              background: 'var(--bg-tertiary)',
              fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
              borderLeft: '3px solid #00d2a0',
              lineHeight: 1.6,
            }}>
              🌱 {rec}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Sub Components --- */

function SustainabilityCard({ label, value, suffix, icon, color, badge }: {
  label: string; value: string; suffix: string;
  icon: React.ReactNode; color: string; badge: string;
}) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="mono" style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color }}>{value}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{suffix}</span>
      </div>
      <div style={{ marginTop: 8 }}>
        <span className="badge" style={{ background: hexToRgba(color, 0.12), color, fontSize: 10 }}>{badge}</span>
      </div>
    </div>
  );
}

function CarbonBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 4 }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="mono" style={{ color: 'var(--text-tertiary)' }}>{value.toLocaleString()} kg ({pct}%)</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

function WasteBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 4 }}>
        <span>{label}</span>
        <span className="mono" style={{ color: 'var(--text-tertiary)' }}>{value.toLocaleString()} kg ({pct}%)</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}
