import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../stores/app-store';
import { useCrowdStore } from '../../stores/crowd-store';
import { processMessage, getWelcomeMessage, type ChatMessage } from '../../engine/ai-assistant';
import { getCurrentMatch } from '../../data/match-schedule';
import { getCurrentWeather } from '../../data/weather-data';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';
import {
  Send, ArrowLeft, MapPin, Utensils, Droplets, Shield,
  Ticket, QrCode, Train
} from 'lucide-react';
import { t, getTextDirection } from '../../engine/multilingual';
import { validateChatInput, createRateLimiter } from '../../utils/sanitize';
import { getTransitRecommendation } from '../../engine/transit-engine';

const chatLimiter = createRateLimiter(10, 30000); // 10 messages per 30s

export default function FanHome() {
  const { seatSection, seatRow, seatNumber, currentZone, language, setLanguage } = useAppStore();
  const densityMap = useCrowdStore((s) => s.densityMap);
  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage()]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const match = getCurrentMatch();
  const weather = getCurrentWeather();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    // Rate limiting
    if (!chatLimiter()) return;

    // Input validation & sanitization
    const { valid, sanitized, error } = validateChatInput(msg);
    if (!valid) {
      const errorMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: error || 'Invalid input. Please try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: sanitized,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const response = processMessage(sanitized, {
        currentZone,
        seatSection,
        seatRow,
        seatNumber,
        language,
        crowdDensity: densityMap,
      });
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div data-theme="light" dir={getTextDirection(language)} style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column',
      maxWidth: 480, margin: '0 auto',
      position: 'relative',
    }}>
      {/* Header */}
      <header style={{
        padding: '12px 16px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <NavLink to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }} aria-label="Back to home">
          <ArrowLeft size={20} aria-hidden="true" />
        </NavLink>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
            {match.flagA} {match.teamA} vs {match.teamB} {match.flagB}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            {match.status === 'live' && match.score ? `${match.score.a} - ${match.score.b} · LIVE` : match.stage}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowQR(!showQR)} style={{ color: 'var(--text-secondary)' }} aria-label="Show QR code">
            <QrCode size={18} aria-hidden="true" />
          </button>
          <LanguageDropdown language={language} setLanguage={setLanguage} />
        </div>
      </header>

      {/* Ticket Info Bar */}
      <div style={{
        padding: '10px 16px',
        background: 'linear-gradient(135deg, #6c5ce7, #4a3db5)',
        color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 'var(--text-xs)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ticket size={14} />
          <span>Section {seatSection} · Row {seatRow} · Seat {seatNumber}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{weather.icon}</span>
          <span>{weather.temperature}°C</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        padding: '12px 16px',
        display: 'flex', gap: 8, overflowX: 'auto',
        borderBottom: '1px solid var(--border-color)',
      }}>
        {[
          { label: t('find_seat', language), icon: MapPin, msg: 'Find my seat' },
          { label: t('restroom', language), icon: Droplets, msg: 'Nearest restroom' },
          { label: t('food', language), icon: Utensils, msg: 'Find food' },
          { label: t('transit', language), icon: Train, msg: 'Transit options' },
          { label: t('emergency', language), icon: Shield, msg: 'Medical help' },
        ].map(action => (
          <button key={action.label}
            onClick={() => handleSend(action.msg)}
            aria-label={action.label}
            style={{
              padding: '8px 14px', borderRadius: 20,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 'var(--text-xs)', fontWeight: 500,
              whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            <action.icon size={13} />
            {action.label}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div role="log" aria-label="Chat messages" aria-live="polite" style={{
        flex: 1, overflowY: 'auto',
        padding: '16px', display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            <div style={{
              maxWidth: '85%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #6c5ce7, #4a3db5)'
                : 'var(--bg-secondary)',
              color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
              fontSize: 'var(--text-sm)',
              lineHeight: 1.6,
              boxShadow: 'var(--shadow-sm)',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}

              {/* Suggestion chips */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {msg.suggestions.map(s => (
                    <button key={s}
                      onClick={() => handleSend(s)}
                      style={{
                        padding: '5px 12px', borderRadius: 14,
                        background: msg.role === 'user' ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
                        border: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.3)' : 'var(--border-color)'}`,
                        color: msg.role === 'user' ? '#fff' : 'var(--color-primary)',
                        fontSize: 11, fontWeight: 500, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div role="status" aria-label="AI is typing" style={{ display: 'flex', gap: 4, padding: '12px 16px', maxWidth: 80 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--text-tertiary)',
                animation: `dotBounce 1.4s ${i * 0.2}s infinite ease-in-out both`,
              }} />
            ))}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex', gap: 8, alignItems: 'center',
        position: 'sticky', bottom: 0,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('ask_anything', language)}
          aria-label="Chat message input"
          maxLength={1000}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 24,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            fontSize: 'var(--text-sm)',
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          aria-label="Send message"
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: input.trim() ? 'linear-gradient(135deg, #6c5ce7, #4a3db5)' : 'var(--bg-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: input.trim() ? '#fff' : 'var(--text-tertiary)',
            transition: 'all 0.2s',
          }}
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function LanguageDropdown({ language, setLanguage }: { language: string; setLanguage: (l: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = SUPPORTED_LANGUAGES.find(l => l.code === language);
  
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ fontSize: 18, cursor: 'pointer' }} aria-label={`Language: ${current?.name || 'Select language'}`} aria-expanded={open} aria-haspopup="listbox">
        {current?.flag || '🌐'}
      </button>
      {open && (
        <div role="listbox" aria-label="Select language" style={{
          position: 'absolute', top: '100%', right: 0,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: 10, padding: 4, minWidth: 140, zIndex: 20,
          boxShadow: 'var(--shadow-lg)',
        }}>
          {SUPPORTED_LANGUAGES.map(l => (
            <button key={l.code}
              role="option"
              aria-selected={l.code === language}
              onClick={() => { setLanguage(l.code); setOpen(false); }}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 6,
                textAlign: 'left', fontSize: 'var(--text-xs)',
                color: 'var(--text-primary)',
                background: l.code === language ? 'var(--bg-tertiary)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span>{l.flag}</span> {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
