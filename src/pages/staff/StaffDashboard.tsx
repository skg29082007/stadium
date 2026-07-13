import { useState } from 'react';
import { useIncidentStore } from '../../stores/incident-store';
import { useCrowdStore } from '../../stores/crowd-store';
import { createIncident } from '../../engine/incident-triage';
import { stadiumZones } from '../../data/stadium-zones';
import { PRIORITY_CONFIG } from '../../utils/constants';
import { densityToColor } from '../../utils/colors';
import { formatPercent } from '../../utils/formatters';
import {
  Radio, Plus, AlertTriangle, CheckCircle2, Clock,
  Users, TrendingUp, TrendingDown, Minus, Send
} from 'lucide-react';

export default function StaffDashboard() {
  const { incidents, addIncident, updateStatus, resolveIncident } = useIncidentStore();
  const snapshot = useCrowdStore((s) => s.snapshot);
  const [showReport, setShowReport] = useState(false);
  const [reportDesc, setReportDesc] = useState('');
  const [reportZone, setReportZone] = useState('zone-n-lower');

  const myIncidents = incidents.filter(i => i.status !== 'RESOLVED').slice(0, 8);
  const assignedZone = 'north';
  const myZones = stadiumZones.filter(z => z.quadrant === assignedZone);

  const handleReport = () => {
    if (!reportDesc.trim()) return;
    const inc = createIncident(reportDesc, reportZone, 'Staff Wilson');
    addIncident(inc);
    setReportDesc('');
    setShowReport(false);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 4 }}>
            <Radio size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Staff Operations
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Assigned Zone: North Quadrant · Staff: Wilson
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowReport(!showReport)}>
          <Plus size={16} /> Quick Report
        </button>
      </div>

      {/* Quick Report Form */}
      {showReport && (
        <div className="card" style={{ padding: 20, marginBottom: 16, borderLeft: '4px solid var(--color-primary)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12 }}>Quick Incident Report</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              placeholder="Describe the incident..."
              style={{ flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && handleReport()}
            />
            <select value={reportZone} onChange={(e) => setReportZone(e.target.value)} style={{ width: 150 }}>
              {stadiumZones.map(z => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={handleReport} disabled={!reportDesc.trim()}>
              <Send size={14} /> Submit
            </button>
          </div>
          {reportDesc && (
            <div style={{ marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              💡 AI will auto-classify category and priority
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Zone Status */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} /> My Zone Status (North)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myZones.map(zone => {
              const zd = snapshot?.zones.find(z => z.zoneId === zone.id);
              const density = zd?.density ?? 50;
              const color = densityToColor(density);
              return (
                <div key={zone.id} style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'var(--bg-tertiary)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{zone.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="mono" style={{ fontWeight: 700, color, fontSize: 'var(--text-sm)' }}>
                        {formatPercent(density)}
                      </span>
                      {zd?.trend === 'rising' ? <TrendingUp size={12} color={color} /> :
                       zd?.trend === 'falling' ? <TrendingDown size={12} color={color} /> :
                       <Minus size={12} color="var(--text-tertiary)" />}
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-primary)', borderRadius: 2, marginTop: 8 }}>
                    <div style={{ width: `${density}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {zd?.count?.toLocaleString() ?? '—'} / {zone.capacity.toLocaleString()} capacity
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Incidents */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} /> Active Incidents
            {myIncidents.length > 0 && (
              <span style={{
                background: 'var(--color-danger)', color: '#fff',
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8,
              }}>{myIncidents.length}</span>
            )}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
            {myIncidents.length === 0 && (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                <CheckCircle2 size={30} style={{ opacity: 0.3, marginBottom: 8 }} />
                <br />No active incidents
              </div>
            )}
            {myIncidents.map(inc => {
              const pConfig = PRIORITY_CONFIG[inc.priority];
              const age = Math.round((Date.now() - inc.reportedAt) / 60000);
              return (
                <div key={inc.id} style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'var(--bg-tertiary)',
                  borderLeft: `3px solid ${pConfig.color}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{inc.title}</span>
                    <span className="badge" style={{ background: pConfig.bgColor, color: pConfig.color, fontSize: 9 }}>
                      {inc.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {inc.description.slice(0, 60)}{inc.description.length > 60 ? '...' : ''}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                      <Clock size={10} style={{ verticalAlign: 'middle' }} /> {age}m ago
                    </span>
                    {inc.status !== 'RESOLVED' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          if (inc.status === 'NEW') updateStatus(inc.id, 'ASSIGNED', 'Staff Wilson');
                          else if (inc.status === 'ASSIGNED') updateStatus(inc.id, 'IN_PROGRESS');
                          else resolveIncident(inc.id);
                        }}
                        style={{ fontSize: 10, padding: '4px 10px' }}
                      >
                        {inc.status === 'NEW' ? 'Accept' : inc.status === 'ASSIGNED' ? 'Start' : 'Resolve'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
