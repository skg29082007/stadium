import { useEffect, useState, useMemo } from 'react';
import { useCrowdStore } from '../../stores/crowd-store';
import { useIncidentStore, selectActiveIncidents } from '../../stores/incident-store';
import { calculateRisk, getRiskHistory, type RiskAssessment } from '../../engine/risk-engine';
import { getRiskColor } from '../../utils/formatters';
import { hexToRgba } from '../../utils/colors';
import { TrendingUp, TrendingDown, Minus, FileText } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function RiskDashboard() {
  const snapshot = useCrowdStore((s) => s.snapshot);
  const incidents = useIncidentStore((s) => s.incidents);
  const activeIncidents = useMemo(() => selectActiveIncidents(incidents), [incidents]);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);

  useEffect(() => {
    if (snapshot) {
      setRisk(calculateRisk(snapshot, activeIncidents));
    }
  }, [snapshot, activeIncidents]);

  const riskHistory = getRiskHistory().map((score, i) => ({ i, score }));
  const score = risk?.overallScore ?? 0;
  const color = getRiskColor(score);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 4 }}>Risk Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Multi-factor risk scoring: Crowd (40%) · Weather (20%) · Transit (15%) · Incidents (15%) · Rivalry (10%)
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, marginBottom: 16 }}>
        {/* Large Risk Gauge */}
        <div className="card" style={{ padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <RiskGaugeLarge score={score} />
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <div className="badge" style={{
              background: hexToRgba(color, 0.15),
              color,
              fontSize: 'var(--text-sm)',
              padding: '4px 16px',
              fontWeight: 700,
            }}>
              {risk?.level || 'N/A'}
            </div>
          </div>
          {/* Trend */}
          <div style={{ marginTop: 16, width: '100%' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 8, textAlign: 'center' }}>Risk Trend</div>
            <div style={{ height: 60 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskHistory.slice(-30)}>
                  <Line type="monotone" dataKey="score" stroke={color} strokeWidth={2} dot={false} />
                  <ReferenceLine y={55} stroke="rgba(255,167,38,0.3)" strokeDasharray="3 3" />
                  <ReferenceLine y={80} stroke="rgba(239,83,80,0.3)" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Risk Factors Breakdown */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 20 }}>Risk Factor Analysis</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {risk?.factors.map(f => {
              const fColor = getRiskColor(f.score);
              return (
                <div key={f.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{f.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{f.name}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>({Math.round(f.weight * 100)}% weight)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="mono" style={{ fontWeight: 700, color: fColor }}>{f.score}</span>
                      {f.trend === 'worsening' ? <TrendingUp size={12} color="var(--color-danger)" /> :
                       f.trend === 'improving' ? <TrendingDown size={12} color="var(--color-success)" /> :
                       <Minus size={12} color="var(--text-tertiary)" />}
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${f.score}%`, height: '100%', borderRadius: 4,
                      background: `linear-gradient(90deg, ${hexToRgba(fColor, 0.7)}, ${fColor})`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                    Weighted contribution: {Math.round(f.weightedScore)} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Situation Report */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} /> AI Situation Report
        </h3>
        <div style={{
          padding: 20, borderRadius: 12, background: 'var(--bg-tertiary)',
          borderLeft: `4px solid ${color}`,
          fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7,
        }}>
          {risk?.summary || 'Generating situation report...'}
        </div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Recommended Actions
          </div>
          {risk?.recommendations.map((rec, i) => (
            <div key={i} style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--bg-input)',
              fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <span style={{ color: 'var(--color-primary)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
              {rec}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RiskGaugeLarge({ score }: { score: number }) {
  const color = getRiskColor(score);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const offset = arcLength - (score / 100) * arcLength;

  return (
    <div style={{ position: 'relative', width: 180, height: 180 }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth="10"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          transform="rotate(135 90 90)" strokeLinecap="round" />
        <circle cx="90" cy="90" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeDashoffset={offset}
          transform="rotate(135 90 90)"
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease', filter: `drop-shadow(0 0 8px ${hexToRgba(color, 0.5)})` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        paddingTop: 10,
      }}>
        <span className="mono" style={{ fontSize: 'var(--text-4xl)', fontWeight: 900, color, lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4, fontWeight: 600 }}>
          RISK SCORE
        </span>
      </div>
    </div>
  );
}
