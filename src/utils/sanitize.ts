/**
 * Input Sanitization & Security Utilities
 *
 * Prevents XSS, validates user input, and provides rate limiting
 * for the stadium operations platform.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

const HTML_ESCAPE_REGEX = /[&<>"'/]/g;

/**
 * Escapes HTML entities to prevent XSS when rendering user input.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Validates that a section number is within the valid MetLife Stadium range.
 * Lower: 101-120, Mezzanine: 201-216, Upper: 301-316
 */
export function validateSectionNumber(section: number): boolean {
  return (
    (section >= 101 && section <= 120) ||
    (section >= 201 && section <= 216) ||
    (section >= 301 && section <= 316)
  );
}

/**
 * Sanitizes free-form text for incident reports.
 * - Escapes HTML entities
 * - Trims whitespace
 * - Enforces maximum length
 */
export function sanitizeIncidentReport(text: string, maxLength: number = 500): string {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim().slice(0, maxLength);
  return sanitizeInput(trimmed);
}

/**
 * Simple rate limiter to prevent spam.
 * Returns true if the action is allowed, false if rate-limited.
 */
export function createRateLimiter(maxActions: number, windowMs: number) {
  const timestamps: number[] = [];

  return function isAllowed(): boolean {
    const now = Date.now();
    // Remove timestamps outside the window
    while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
      timestamps.shift();
    }
    if (timestamps.length >= maxActions) {
      return false;
    }
    timestamps.push(now);
    return true;
  };
}

/**
 * Validates that chat input is safe and within acceptable limits.
 */
export function validateChatInput(input: string): { valid: boolean; sanitized: string; error?: string } {
  if (typeof input !== 'string' || input.trim().length === 0) {
    return { valid: false, sanitized: '', error: 'Input cannot be empty' };
  }

  if (input.length > 1000) {
    return { valid: false, sanitized: '', error: 'Message too long (max 1000 characters)' };
  }

  // Check for potential script injection
  const dangerousPatterns = /<script|javascript:|on\w+\s*=/i;
  if (dangerousPatterns.test(input)) {
    return { valid: false, sanitized: '', error: 'Invalid characters detected' };
  }

  return { valid: true, sanitized: sanitizeInput(input.trim()) };
}
