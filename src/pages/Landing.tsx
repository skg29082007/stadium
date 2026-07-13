import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/app-store';
import { Monitor, Smartphone, Radio, Trophy, ChevronRight } from 'lucide-react';

const modes = [
  {
    key: 'command' as const,
    to: '/command',
    icon: Monitor,
    title: 'Command Center',
    subtitle: 'Real-time operations dashboard',
    description: 'Crowd heatmaps, risk scoring, incident management, and scenario simulation for stadium operators.',
    gradient: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
    features: ['Live Crowd Heatmap', 'Risk Intelligence', 'Scenario Simulator', 'Incident Triage'],
  },
  {
    key: 'fan' as const,
    to: '/fan',
    icon: Smartphone,
    title: 'Fan Experience',
    subtitle: 'AI-powered stadium assistant',
    description: 'Navigate the stadium, find your seat, locate food & restrooms, get live match updates — all via AI chat.',
    gradient: 'linear-gradient(135deg, #00d2a0, #00b894)',
    features: ['AI Chat Assistant', 'Seat Navigation', 'Amenity Finder', 'Multilingual'],
  },
  {
    key: 'staff' as const,
    to: '/staff',
    icon: Radio,
    title: 'Staff Operations',
    subtitle: 'Volunteer & staff tools',
    description: 'Report incidents, manage tasks, monitor assigned zones, receive AI-triaged alerts.',
    gradient: 'linear-gradient(135deg, #e9b44c, #f39c12)',
    features: ['Incident Reporting', 'AI Triage', 'Task Queue', 'Zone Monitoring'],
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const setMode = useAppStore((s) => s.setMode);

  const handleSelect = (mode: typeof modes[0]) => {
    setMode(mode.key);
    navigate(mode.to);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 30% 20%, rgba(108, 92, 231, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(233, 180, 76, 0.1) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }} className="animate-fade-in">
        <div style={{
          fontSize: 48, marginBottom: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <Trophy size={42} style={{ color: 'var(--color-fifa-gold)' }} />
        </div>
        <h1 style={{
          fontSize: 'var(--text-4xl)', fontWeight: 900,
          letterSpacing: '-0.03em', lineHeight: 1.1,
          marginBottom: 12,
        }}>
          <span className="gradient-text">Smart Stadium</span>
        </h1>
        <p style={{ fontSize: 'var(--text-xl)', color: 'var(--text-secondary)', fontWeight: 300 }}>
          FIFA World Cup 2026 — GenAI Operations Platform
        </p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 8 }}>
          New York New Jersey Stadium · 80,663 Capacity · 16 Host Venues
        </p>
      </div>

      {/* Mode Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 24,
        maxWidth: 1100,
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}>
        {modes.map((mode, i) => (
          <button
            key={mode.key}
            onClick={() => handleSelect(mode)}
            className="animate-slide-up"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 20,
              padding: 0,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              animationDelay: `${i * 100}ms`,
              animationFillMode: 'backwards',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
              e.currentTarget.style.borderColor = 'var(--border-color-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            {/* Gradient Header */}
            <div style={{
              background: mode.gradient,
              padding: '28px 28px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <mode.icon size={24} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: '#fff', margin: 0 }}>
                  {mode.title}
                </h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                  {mode.subtitle}
                </p>
              </div>
              <ChevronRight size={20} color="rgba(255,255,255,0.5)" style={{ marginLeft: 'auto' }} />
            </div>

            {/* Body */}
            <div style={{ padding: '20px 28px 28px' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                {mode.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {mode.features.map(f => (
                  <span key={f} className="badge badge-neutral" style={{ fontSize: 10 }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 48, textAlign: 'center',
        fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
        position: 'relative', zIndex: 1,
      }}>
        <p>GenAI-Powered Stadium Operations · Predictive Analytics · Real-Time Intelligence</p>
        <p style={{ marginTop: 4, opacity: 0.5 }}>
          MVP Demo — Simulated Data · Not affiliated with FIFA
        </p>
      </div>
    </div>
  );
}
