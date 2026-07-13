import { describe, it, expect } from 'vitest';
import { processMessage, getWelcomeMessage, type AssistantContext } from '../ai-assistant';

const defaultContext: AssistantContext = {
  currentZone: 'gate-a',
  seatSection: 217,
  seatRow: 12,
  seatNumber: 8,
  language: 'en',
  crowdDensity: {},
};

describe('ai-assistant — processMessage', () => {
  it('responds to navigation queries', () => {
    const result = processMessage('How do I get to Section 105?', defaultContext);
    expect(result.role).toBe('assistant');
    expect(result.content).toContain('105');
    expect(result.content.length).toBeGreaterThan(20);
  });

  it('responds to seat finding queries', () => {
    const result = processMessage('Find my seat', defaultContext);
    expect(result.content).toContain('217');
    expect(result.content).toContain('12');
    expect(result.content).toContain('8');
  });

  it('responds to restroom queries', () => {
    const result = processMessage('Where is the nearest restroom?', defaultContext);
    expect(result.content.toLowerCase()).toContain('restroom');
  });

  it('responds to food queries', () => {
    const result = processMessage('Find food', defaultContext);
    expect(result.content.toLowerCase()).toContain('food');
  });

  it('responds to medical emergency queries', () => {
    const result = processMessage('I need medical help', defaultContext);
    expect(result.content.toLowerCase()).toContain('medical');
  });

  it('responds to match info queries', () => {
    const result = processMessage("What's the score?", defaultContext);
    expect(result.content).toContain('Match');
  });

  it('responds to schedule queries', () => {
    const result = processMessage('Show full schedule', defaultContext);
    expect(result.content).toContain('Schedule');
  });

  it('responds to exit queries', () => {
    const result = processMessage('How do I leave?', defaultContext);
    expect(result.content.toLowerCase()).toContain('exit');
  });

  it('responds to wifi queries', () => {
    const result = processMessage('What is the wifi password?', defaultContext);
    expect(result.content).toContain('WiFi');
  });

  it('responds to accessibility queries', () => {
    const result = processMessage('Wheelchair route', defaultContext);
    expect(result.content).toContain('Accessibility');
  });

  it('responds to greetings', () => {
    const result = processMessage('Hello', defaultContext);
    expect(result.content).toContain('Welcome');
  });

  it('responds to thanks', () => {
    const result = processMessage('Thank you!', defaultContext);
    expect(result.content.toLowerCase()).toContain('welcome');
  });

  it('returns default help for unknown queries', () => {
    const result = processMessage('xyzzy', defaultContext);
    expect(result.content).toContain('Stadium Assistant');
  });

  it('returns suggestions with responses', () => {
    const result = processMessage('Find my seat', defaultContext);
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions!.length).toBeGreaterThan(0);
  });

  it('returns route data for navigation queries', () => {
    const result = processMessage('How do I get to Section 105?', defaultContext);
    expect(result.routeData).toBeDefined();
    expect(result.routeData!.from).toBe('gate-a');
    expect(result.routeData!.to).toBe('sec-105');
    expect(result.routeData!.distance).toBeGreaterThan(0);
  });

  it('handles empty input', () => {
    const result = processMessage('', defaultContext);
    expect(result.role).toBe('assistant');
    expect(result.content).toContain('Stadium Assistant');
  });

  it('handles section-only references like "Section 110"', () => {
    const result = processMessage('Section 110', defaultContext);
    expect(result.content).toContain('110');
  });

  it('handles gate references', () => {
    const result = processMessage('Gate B', defaultContext);
    expect(result.content.length).toBeGreaterThan(10);
  });
});

describe('ai-assistant — getWelcomeMessage', () => {
  it('returns a well-formed welcome message', () => {
    const msg = getWelcomeMessage();
    expect(msg.role).toBe('assistant');
    expect(msg.content).toContain('FIFA World Cup 2026');
    expect(msg.content).toContain('New York New Jersey Stadium');
    expect(msg.suggestions).toBeDefined();
    expect(msg.suggestions!.length).toBeGreaterThan(0);
    expect(msg.id).toBeTruthy();
    expect(msg.timestamp).toBeGreaterThan(0);
  });
});
