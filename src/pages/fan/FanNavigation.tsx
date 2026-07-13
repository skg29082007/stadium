import { NavLink } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function FanNavigation() {
  return (
    <div data-theme="light" style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      maxWidth: 480, margin: '0 auto',
    }}>
      <header style={{
        padding: '12px 16px', background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <NavLink to="/fan" style={{ color: 'var(--text-secondary)' }}><ArrowLeft size={20} /></NavLink>
        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Stadium Navigation</span>
      </header>
      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p style={{ fontSize: 'var(--text-sm)' }}>
          Use the AI Chat on the main screen to get navigation directions.
        </p>
        <p style={{ fontSize: 'var(--text-sm)', marginTop: 12 }}>
          Try: "How do I get to Section 217?" or "Find my seat"
        </p>
        <NavLink to="/fan" className="btn btn-primary" style={{ marginTop: 20, textDecoration: 'none' }}>
          Back to Chat
        </NavLink>
      </div>
    </div>
  );
}
