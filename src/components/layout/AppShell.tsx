import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../../stores/app-store';
import { useCrowdStore } from '../../stores/crowd-store';
import { useIncidentStore, selectActiveIncidents } from '../../stores/incident-store';
import { formatTimeShort } from '../../utils/formatters';
import { MATCH_PHASES } from '../../utils/constants';
import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Users, AlertTriangle, Activity,
  Radio, Shield, Menu, X, ChevronDown, Leaf
} from 'lucide-react';

const navItems = [
  { to: '/command', label: 'Overview', icon: LayoutDashboard },
  { to: '/command/crowd', label: 'Crowd Analytics', icon: Users },
  { to: '/command/risk', label: 'Risk Dashboard', icon: AlertTriangle },
  { to: '/command/scenarios', label: 'Scenarios', icon: Activity },
  { to: '/command/incidents', label: 'Incidents', icon: Shield },
  { to: '/command/sustainability', label: 'Sustainability', icon: Leaf },
  { to: '/staff', label: 'Staff Ops', icon: Radio },
];

export default function AppShell() {
  const { matchPhase, setMatchPhase } = useAppStore();
  const snapshot = useCrowdStore((s) => s.snapshot);
  const incidents = useIncidentStore((s) => s.incidents);
  const activeIncidents = useMemo(() => selectActiveIncidents(incidents), [incidents]);
  const [now, setNow] = useState(new Date());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { setMobileNavOpen(false); }, [location.pathname]);

  const criticalCount = activeIncidents.filter(i => i.priority === 'CRITICAL').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Skip Navigation — Accessibility */}
      <a href="#main-content" className="skip-nav">Skip to main content</a>

      {/* Sidebar */}
      <aside aria-label="Main navigation" style={{
        width: 260,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: mobileNavOpen ? 0 : undefined,
        bottom: 0,
        zIndex: 30,
        transform: mobileNavOpen ? 'translateX(0)' : undefined,
      }} className="sidebar-desktop">
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>⚽</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                FIFA WC 2026
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                Smart Stadium Ops
              </div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav role="navigation" aria-label="Stadium operations" style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/command'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(108, 92, 231, 0.12)' : 'transparent',
                textDecoration: 'none', fontSize: 'var(--text-sm)', fontWeight: isActive ? 600 : 400,
                transition: 'all 150ms ease',
              })}
            >
              <item.icon size={18} />
              {item.label}
              {item.to === '/command/incidents' && criticalCount > 0 && (
                <span style={{
                  marginLeft: 'auto', background: 'var(--color-danger)',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center',
                }}>{criticalCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Match Phase Selector */}
        <div style={{
          padding: '16px', borderTop: '1px solid var(--border-color)',
        }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 6, display: 'block' }}>
            Match Phase
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={matchPhase}
              onChange={(e) => setMatchPhase(e.target.value as typeof matchPhase)}
              style={{
                width: '100%', padding: '8px 30px 8px 10px', borderRadius: 8,
                background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                border: '1px solid var(--border-color)', fontSize: 'var(--text-xs)',
                appearance: 'none', cursor: 'pointer',
              }}
            >
              {MATCH_PHASES.map(p => (
                <option key={p} value={p}>{p.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)' }} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: 260, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <header role="banner" aria-label="Match status bar" style={{
          height: 56, padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          position: 'sticky', top: 0, zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="btn-icon btn-ghost mobile-menu" onClick={() => setMobileNavOpen(!mobileNavOpen)} style={{ display: 'none' }} aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileNavOpen}>
              {mobileNavOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="status-dot live" />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                🇺🇸 USA vs Germany 🇩🇪
              </span>
              <span className="badge badge-danger" style={{ fontSize: 10 }}>LIVE</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              <Users size={14} aria-hidden="true" />
              <span className="mono" aria-live="polite" aria-label={`Current attendance: ${snapshot ? snapshot.totalAttendance.toLocaleString() : 'loading'}`}>{snapshot ? snapshot.totalAttendance.toLocaleString() : '—'}</span>
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }} className="mono">
              {formatTimeShort(now)}
            </div>
            <NavLink to="/fan" style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 'var(--text-xs)',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
              color: '#fff', fontWeight: 600, textDecoration: 'none',
            }}>
              📱 Fan App
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" role="main" aria-label="Page content" style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div onClick={() => setMobileNavOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 25,
        }} />
      )}

      <style>{`
        @media (max-width: 900px) {
          .sidebar-desktop {
            transform: translateX(${mobileNavOpen ? '0' : '-100%'}) !important;
            transition: transform 0.3s ease;
          }
          .sidebar-desktop ~ div {
            margin-left: 0 !important;
          }
          .mobile-menu {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
