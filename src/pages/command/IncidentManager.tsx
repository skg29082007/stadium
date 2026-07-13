import { useState } from 'react';
import { useIncidentStore } from '../../stores/incident-store';
import { createIncident, type Incident } from '../../engine/incident-triage';
import { INCIDENT_CATEGORIES, INCIDENT_CATEGORY_CONFIG, PRIORITY_CONFIG, type IncidentCategory } from '../../utils/constants';
import {
  Plus, AlertTriangle,
  ChevronDown, X
} from 'lucide-react';

export default function IncidentManager() {
  const { incidents, updateStatus, resolveIncident, addIncident } = useIncidentStore();
  const [filter, setFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);

  const filtered = incidents.filter(i => {
    if (filter !== 'all' && i.status !== filter) return false;
    if (priorityFilter !== 'all' && i.priority !== priorityFilter) return false;
    return true;
  });

  const statusCounts = {
    all: incidents.length,
    NEW: incidents.filter(i => i.status === 'NEW').length,
    ASSIGNED: incidents.filter(i => i.status === 'ASSIGNED').length,
    IN_PROGRESS: incidents.filter(i => i.status === 'IN_PROGRESS').length,
    RESOLVED: incidents.filter(i => i.status === 'RESOLVED').length,
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 4 }}>Incident Manager</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            AI-triaged incident tracking with auto-classification and routing
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowReportForm(true)}>
          <Plus size={16} /> Report Incident
        </button>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['all', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'] as const).map(status => (
          <button key={status}
            className={`btn btn-sm ${filter === status ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
            <span style={{
              marginLeft: 6, padding: '1px 6px', borderRadius: 8,
              background: filter === status ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
              fontSize: 10,
            }}>
              {statusCounts[status]}
            </span>
          </button>
        ))}
        {/* Priority filter */}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: '6px 28px 6px 10px', borderRadius: 8, fontSize: 'var(--text-xs)',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', appearance: 'none', cursor: 'pointer',
            }}
          >
            <option value="all">All Priorities</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🔵 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Incident Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              {['Priority', 'Category', 'Title', 'Zone', 'Reporter', 'Status', 'Time', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '12px 14px', textAlign: 'left',
                  fontSize: 'var(--text-xs)', fontWeight: 600,
                  color: 'var(--text-tertiary)', textTransform: 'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                No incidents match the current filter
              </td></tr>
            )}
            {filtered.slice(0, 30).map(inc => {
              const pConfig = PRIORITY_CONFIG[inc.priority];
              const cConfig = INCIDENT_CATEGORY_CONFIG[inc.category];
              const age = Math.round((Date.now() - inc.reportedAt) / 60000);

              return (
                <tr key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <span className="badge" style={{ background: pConfig.bgColor, color: pConfig.color }}>
                      {inc.priority}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: cConfig.color, fontWeight: 500 }}>
                    {inc.category}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 500, maxWidth: 200 }} className="truncate">
                    {inc.title}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    {inc.zone.replace('zone-', '').replace(/-/g, ' ').toUpperCase()}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    {inc.reportedBy}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <StatusBadge status={inc.status} />
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }} className="mono">
                    {age}m ago
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {inc.status !== 'RESOLVED' && (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (inc.status === 'NEW') updateStatus(inc.id, 'ASSIGNED', 'Response Team Alpha');
                          else if (inc.status === 'ASSIGNED') updateStatus(inc.id, 'IN_PROGRESS');
                          else resolveIncident(inc.id);
                        }}
                      >
                        {inc.status === 'NEW' ? 'Assign' : inc.status === 'ASSIGNED' ? 'Start' : 'Resolve'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <Modal onClose={() => setSelectedIncident(null)}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 4 }}>{selectedIncident.title}</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <span className="badge" style={{ background: PRIORITY_CONFIG[selectedIncident.priority].bgColor, color: PRIORITY_CONFIG[selectedIncident.priority].color }}>
              {selectedIncident.priority}
            </span>
            <span className="badge badge-neutral">{selectedIncident.category}</span>
            <StatusBadge status={selectedIncident.status} />
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            <strong>Description:</strong> {selectedIncident.description}
          </div>
          <div style={{
            padding: 16, borderRadius: 10, background: 'var(--bg-tertiary)',
            borderLeft: '3px solid var(--color-primary)', marginBottom: 16,
          }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 4 }}>AI TRIAGE SUMMARY</div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedIncident.aiSummary}</p>
          </div>
          <div style={{
            padding: 16, borderRadius: 10, background: 'var(--bg-tertiary)',
            borderLeft: '3px solid var(--color-success)',
          }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 4 }}>SUGGESTED ACTION</div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedIncident.suggestedAction}</p>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 16, display: 'flex', gap: 16 }}>
            <span>📍 {selectedIncident.zone.replace('zone-','').replace(/-/g,' ').toUpperCase()}</span>
            <span>👤 {selectedIncident.reportedBy}</span>
            <span>⏱ ETA: {selectedIncident.estimatedResponseMinutes}min</span>
          </div>
        </Modal>
      )}

      {/* Report Form Modal */}
      {showReportForm && (
        <ReportForm onClose={() => setShowReportForm(false)} onSubmit={(inc) => { addIncident(inc); setShowReportForm(false); }} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    NEW: { bg: 'rgba(239,83,80,0.12)', color: '#ef5350' },
    ASSIGNED: { bg: 'rgba(255,167,38,0.12)', color: '#ffa726' },
    IN_PROGRESS: { bg: 'rgba(66,165,245,0.12)', color: '#42a5f5' },
    RESOLVED: { bg: 'rgba(0,210,160,0.12)', color: '#00d2a0' },
  };
  const c = colors[status] || colors.NEW;
  return <span className="badge" style={{ background: c.bg, color: c.color }}>{status.replace('_', ' ')}</span>;
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)', borderRadius: 16,
        padding: 28, maxWidth: 560, width: '90%', maxHeight: '80vh', overflowY: 'auto',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          color: 'var(--text-tertiary)',
        }}><X size={18} /></button>
        {children}
      </div>
    </div>
  );
}

function ReportForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (inc: Incident) => void }) {
  const [desc, setDesc] = useState('');
  const [zone, setZone] = useState('zone-n-lower');
  const [category, setCategory] = useState<IncidentCategory | ''>('');

  const handleSubmit = () => {
    if (!desc.trim()) return;
    const inc = createIncident(desc, zone, 'Command Center', undefined, category || undefined);
    onSubmit(inc);
  };

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 16 }}>Report New Incident</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Description *</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe the incident..."
            rows={3} style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Zone</label>
            <select value={zone} onChange={(e) => setZone(e.target.value)} style={{ width: '100%' }}>
              {['zone-n-lower','zone-n-mezz','zone-n-upper','zone-e-lower','zone-e-mezz','zone-e-upper',
                'zone-s-lower','zone-s-mezz','zone-s-upper','zone-w-lower','zone-w-mezz','zone-w-upper'].map(z => (
                <option key={z} value={z}>{z.replace('zone-','').replace(/-/g,' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Category (auto-detected)</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as IncidentCategory)} style={{ width: '100%' }}>
              <option value="">Auto-detect</option>
              {INCIDENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={!desc.trim()}>
          <AlertTriangle size={16} /> Submit Incident
        </button>
      </div>
    </Modal>
  );
}
