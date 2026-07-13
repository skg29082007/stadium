import { describe, it, expect } from 'vitest';
import { sanitizeInput, validateSectionNumber, validateChatInput } from '../sanitize';

describe('sanitize utils', () => {
  it('strips dangerous html', () => {
    const dirty = '<script>alert("xss")</script>Hello <b>World</b>';
    const clean = sanitizeInput(dirty);
    expect(clean).not.toContain('<script>');
  });

  it('validates section numbers', () => {
    expect(validateSectionNumber(101)).toBe(true);
    expect(validateSectionNumber(201)).toBe(true);
    expect(validateSectionNumber(301)).toBe(true);
    expect(validateSectionNumber(999)).toBe(false);
  });

  it('validates chat input', () => {
    expect(validateChatInput('Hello').valid).toBe(true);
    expect(validateChatInput('<script>').valid).toBe(false);
    expect(validateChatInput('<script>').sanitized).not.toContain('<script>');
    
    // Test too long
    const longString = 'a'.repeat(1050);
    expect(validateChatInput(longString).valid).toBe(false);
  });
});
