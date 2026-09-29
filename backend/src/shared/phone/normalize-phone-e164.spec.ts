import { describe, expect, it } from 'vitest';
import { normalizePhoneToE164 } from './normalize-phone-e164';

describe('normalizePhoneToE164', () => {
  it('keeps E.164 when already prefixed with +', () => {
    expect(normalizePhoneToE164('+79161234567')).toBe('+79161234567');
  });

  it('normalizes 10-digit RU mobile to +7', () => {
    expect(normalizePhoneToE164('9161234567')).toBe('+79161234567');
  });

  it('normalizes 11-digit RU with leading 8', () => {
    expect(normalizePhoneToE164('89161234567')).toBe('+79161234567');
  });

  it('returns null for plain login-like string', () => {
    expect(normalizePhoneToE164('adminuser')).toBeNull();
  });
});
