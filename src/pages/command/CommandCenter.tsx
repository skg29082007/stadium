import { useEffect, useState, useMemo } from 'react';
import { useCrowdStore } from '../../stores/crowd-store';
import { useIncidentStore, selectActiveIncidents } from '../../stores/incident-store';
import { useAppStore } from '../../stores/app-store';
import { calculateRisk, getRiskHistory, type RiskAssessment } from '../../engine/risk-engine';
import { getBottleneckAlerts } from '../../engine/crowd-predictor';
import { stadiumZones } from '../../data/stadium-zones';
import { getCurrentWeather } from '../../data/weather-data';
import { getCurrentMatch } from '../../data/match-schedule';
import { formatNumber, formatPercent, getRiskColor, getDensityColor } from '../../utils/formatters';
import { densityToColor, hexToRgba } from '../../utils/colors';
import {
  Users, AlertTriangle, Activity, Shield,
  TrendingUp, TrendingDown, Minus, Zap,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

export default function CommandCenter() {
  const snapshot = useCrowdStore((s) => s.snapshot);
  const predictions = useCrowdStore((s) => s.predictions);
  const crowdHistory = useCrowdStore((s) => s.history);
  const incidents = useIncidentStore((s) => s.incidents);
  const activeIncidents = useMemo(() => selectActiveIncidents(incidents), [incidents]);
  const { matchPhase } = useAppStore();
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const weather = getCurrentWeather();
  const match = getCurrentMatch();

  useEffect(() => {
    if (snapshot) {
      const r = calculateRisk(snapshot, activeIncidents);
      setRisk(r);
    }
  }, [snapshot, activeIncidents]);

  const bottlenecks = getBottleneckAlerts(predictions);
  const criticalIncidents = activeIncidents.filter(i => i.priority === 'CRITICAL');
  const riskHistory = getRiskHistory().map((score, i) => ({ i, score }));

  // Crowd history for chart
  const crowdChartData = crowdHistory.slice(-60).map((s, i) => ({
    i,
    total: s.totalAttendance,
    avg: Math.round(s.avgDensity),
  }));

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 4 }}>
            Command Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            {match.flagA} {match.teamA} vs {match.teamB} {match.flagB} · {matchPhase.replace('-', ' ')} · {weather.icon} {weather.temperature}°C
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Risk Score */}
        <MetricCard
          label="Risk Score"
          value={risk ? risk.overallScore.toString() : '—'}
          suffix="/100"
          icon={<AlertTriangle size={18} />}
          color={risk ? getRiskColor(risk.overallScore) : '#666'}
          badge={risk?.level || 'N/A'}
          badgeColor={risk ? getRiskColor(risk.overallScore) : '#666'}
          trend={riskHistory.length > 5 ? (riskHistory[riskHistory.length-1]?.score > riskHistory[riskHistory.length-5]?.score ? 'up' : 'down') : undefined}
        />

        {/* Total Attendance */}
        <MetricCard
          label="Attendance"
          value={snapshot ? formatNumber(snapshot.totalAttendance) : '—'}
          suffix="/ 80,663"
          icon={<Users size={18} />}
          color="var(--color-primary-light)"
          badge={snapshot ? formatPercent(snapshot.avgDensity) : '—'}
          badgeColor={snapshot ? getDensityColor(snapshot.avgDensity) : '#666'}
        />

        {/* Active Incidents */}
        <MetricCard
          label="Active Incidents"
          value={activeIncidents.length.toString()}
          suffix={criticalIncidents.length > 0 ? `(${criticalIncidents.length} critical)` : ''}
          icon={<Shield size={18} />}
          color={criticalIncidents.length > 0 ? 'var(--color-danger)' : 'var(--color-success)'}
          badge={criticalIncidents.length > 0 ? 'ALERT' : 'NORMAL'}
          badgeColor={criticalIncidents.length > 0 ? 'var(--color-danger)' : 'var(--color-success)'}
        />

        {/* Bottleneck Alerts */}
        <MetricCard
          label="Bottleneck Alerts"
          value={bottlenecks.length.toString()}
          suffix="zones at risk"
          icon={<Zap size={18} />}
          color={bottlenecks.length > 0 ? 'var(--color-warning)' : 'var(--color-success)'}
          badge={bottlenecks.length > 0 ? 'WARNING' : 'CLEAR'}
          badgeColor={bottlenecks.length > 0 ? 'var(--color-warning)' : 'var(--color-success)'}
        />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Stadium Heatmap Mini */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} /> Zone Density Overview
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {stadiumZones.map(zone => {
              const zoneData = snapshot?.zones.find(z => z.zoneId === zone.id);
              const density = zoneData?.density ?? 50;
              const color = densityToColor(density);
              return (
                <div key={zone.id} style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: hexToRgba(color, 0.1),
                  border: `1px solid ${hexToRgba(color, 0.25)}`,
                  transition: 'all 0.3s ease',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                    {zone.name}
                  </div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color }} className="mono">
                    {Math.round(density)}%
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    {zoneData?.trend === 'rising' ? <TrendingUp size={10} color={color} /> :
                     zoneData?.trend === 'falling' ? <TrendingDown size={10} color={color} /> :
                     <Minus size={10} color="var(--text-tertiary)" />}
                    <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                      {zoneData?.count?.toLocaleString() || '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} /> Risk Intelligence
          </h3>
          {risk && (
            <>
              {/* Risk Gauge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
                <RiskGaugeMini score={risk.overallScore} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {risk.summary}
                  </p>
                </div>
              </div>

              {/* Factor Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {risk.factors.map(f => (
                  <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, width: 20 }}>{f.icon}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', width: 90 }}>
                      {f.name}
                    </span>
                    <div style={{
                      flex: 1, height: 6, borderRadius: 3,
                      background: 'var(--bg-tertiary)', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${f.score}%`, height: '100%',
                        borderRadius: 3,
                        background: getRiskColor(f.score),
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <span className="mono" style={{ fontSize: 'var(--text-xs)', color: getRiskColor(f.score), width: 30, textAlign: 'right' }}>
                      {f.score}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Crowd Trend Chart */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} /> Crowd Trend (Live)
          </h3>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={crowdChartData}>
                <XAxis dataKey="i" hide />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={() => ''}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: any, name: any) => [
                    name === 'total' ? Number(value).toLocaleString() : `${value}%`,
                    name === 'total' ? 'Attendance' : 'Avg Density'
                  ]) as any}
                />
                <Line type="monotone" dataKey="avg" stroke="#6c5ce7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="total" stroke="#00d2a0" strokeWidth={1.5} dot={false} strokeDasharray="4 2" yAxisId="right" hide />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Alerts / AI Recommendations */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} /> AI Recommendations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {risk?.recommendations.map((rec, i) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--bg-tertiary)',
                fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
                borderLeft: '3px solid var(--color-primary)',
                lineHeight: 1.5,
              }}>
                💡 {rec}
              </div>
            ))}
            {(!risk || risk.recommendations.length === 0) && (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', padding: 20, textAlign: 'center' }}>
                All operations normal — no recommendations at this time.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Sub-components --- */

function MetricCard({ label, value, suffix, icon, color, badge, badgeColor, trend }: {
  label: string; value: string; suffix?: string;
  icon: React.ReactNode; color: string;
  badge: string; badgeColor: string;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="mono" style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color }}>{value}</span>
        {suffix && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{suffix}</span>}
        {trend && (
          trend === 'up'
            ? <TrendingUp size={14} color="var(--color-danger)" />
            : <TrendingDown size={14} color="var(--color-success)" />
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        <span className="badge" style={{
          background: hexToRgba(badgeColor, 0.12),
          color: badgeColor,
        }}>{badge}</span>
      </div>
    </div>
  );
}

function RiskGaugeMini({ score }: { score: number }) {
  const color = getRiskColor(score);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        {/* Background circle */}
        <circle cx="45" cy="45" r="36" fill="none" stroke="var(--bg-tertiary)" strokeWidth="6" />
        {/* Progress arc */}
        <circle
          cx="45" cy="45" r="36" fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="mono" style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color }}>{score}</span>
        <span style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
          Risk
        </span>
      </div>
    </div>
  );
}
