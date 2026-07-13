import { describe, it, expect } from 'vitest';
import { t, getTextDirection, getTranslationKeys } from '../multilingual';

describe('multilingual engine', () => {
  it('translates known keys', () => {
    expect(t('find_seat', 'es')).toBe('Encontrar mi Asiento');
    expect(t('find_seat', 'fr')).toBe('Trouver ma Place');
  });

  it('falls back to english for unknown keys', () => {
    expect(t('UnknownKey', 'es')).toBe('UnknownKey');
  });

  it('gets correct text direction', () => {
    expect(getTextDirection('es')).toBe('ltr');
    expect(getTextDirection('ar')).toBe('rtl');
  });

  it('returns translation keys', () => {
    expect(getTranslationKeys().length).toBeGreaterThan(0);
  });
});
