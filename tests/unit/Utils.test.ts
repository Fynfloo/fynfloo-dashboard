// tests/unit/utils.test.ts
//
// Layer 2 — Pure utility function tests
// These are fast, zero-dependency, highest signal-to-noise ratio tests.
// Every price conversion bug would be caught here.

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPriceInput,
  parsePriceInput,
  getCurrencySymbol,
  formatRelativeTime,
  getInitials,
} from '@/lib/utils';

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('converts pence to pounds correctly', () => {
    expect(formatCurrency(4999, 'GBP')).toBe('£49.99');
  });

  it('converts kobo to naira correctly', () => {
    expect(formatCurrency(100000, 'NGN')).toContain('1,000');
  });

  it('handles zero', () => {
    expect(formatCurrency(0, 'GBP')).toBe('£0.00');
  });

  it('handles large amounts', () => {
    expect(formatCurrency(100000, 'GBP')).toBe('£1,000.00');
  });

  it('formats USD correctly', () => {
    expect(formatCurrency(2999, 'USD')).toBe('US$29.99');
  });
});

// ─── formatPriceInput ─────────────────────────────────────────────────────────

describe('formatPriceInput', () => {
  it('converts 4999 to "49.99"', () => {
    expect(formatPriceInput(4999)).toBe('49.99');
  });

  it('converts 99 to "0.99"', () => {
    expect(formatPriceInput(99)).toBe('0.99');
  });

  it('converts 10000 to "100.00"', () => {
    expect(formatPriceInput(10000)).toBe('100.00');
  });

  it('returns empty string for 0', () => {
    expect(formatPriceInput(0)).toBe('');
  });

  it('returns empty string for null', () => {
    expect(formatPriceInput(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatPriceInput(undefined)).toBe('');
  });
});

// ─── parsePriceInput ──────────────────────────────────────────────────────────

describe('parsePriceInput', () => {
  it('converts "49.99" to 4999', () => {
    expect(parsePriceInput('49.99')).toBe(4999);
  });

  it('converts "49." to 4900', () => {
    expect(parsePriceInput('49.')).toBe(4900);
  });

  it('converts "49" to 4900', () => {
    expect(parsePriceInput('49')).toBe(4900);
  });

  it('converts "0.99" to 99', () => {
    expect(parsePriceInput('0.99')).toBe(99);
  });

  it('returns 0 for empty string', () => {
    expect(parsePriceInput('')).toBe(0);
  });

  it('returns 0 for "."', () => {
    expect(parsePriceInput('.')).toBe(0);
  });

  it('strips currency symbols from pasted values', () => {
    expect(parsePriceInput('£49.99')).toBe(4999);
    expect(parsePriceInput('$49.99')).toBe(4999);
    expect(parsePriceInput('₦1,000.00')).toBe(100000);
  });

  it('handles floating point precision correctly (no rounding errors)', () => {
    // 49.99 * 100 = 4998.999... without Math.round
    expect(parsePriceInput('49.99')).toBe(4999);
    expect(Number.isInteger(parsePriceInput('49.99'))).toBe(true);
  });

  it('round-trips correctly: format then parse', () => {
    const original = 4999;
    const display = formatPriceInput(original);
    const backToMinorUnits = parsePriceInput(display!);
    expect(backToMinorUnits).toBe(original);
  });

  it('round-trips for various amounts', () => {
    const amounts = [99, 100, 999, 1000, 4999, 10000, 99999, 100000];
    for (const amount of amounts) {
      const display = formatPriceInput(amount);
      expect(parsePriceInput(display!), `Failed for ${amount}`).toBe(amount);
    }
  });
});

// ─── getCurrencySymbol ────────────────────────────────────────────────────────

describe('getCurrencySymbol', () => {
  it('returns £ for GBP', () => expect(getCurrencySymbol('GBP')).toBe('£'));
  it('returns ₦ for NGN', () => expect(getCurrencySymbol('NGN')).toBe('₦'));
  it('returns $ for USD', () => expect(getCurrencySymbol('USD')).toBe('$'));
  it('returns € for EUR', () => expect(getCurrencySymbol('EUR')).toBe('€'));
  it('returns GH₵ for GHS', () => expect(getCurrencySymbol('GHS')).toBe('GH₵'));
  it('returns KSh for KES', () => expect(getCurrencySymbol('KES')).toBe('KSh'));
  it('returns R for ZAR', () => expect(getCurrencySymbol('ZAR')).toBe('R'));
  it('returns currency code as fallback for unknown currency', () => {
    expect(getCurrencySymbol('XYZ')).toBe('XYZ');
  });
  it('is case insensitive', () => {
    expect(getCurrencySymbol('gbp')).toBe('£');
  });
});

// ─── formatRelativeTime ───────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  it('returns "Just now" for < 60 seconds ago', () => {
    const recent = new Date(Date.now() - 30 * 1000).toISOString();
    expect(formatRelativeTime(recent)).toBe('Just now');
  });

  it('returns minutes ago for < 1 hour', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe('5 minutes ago');
  });

  it('returns "1 minute ago" (singular) for exactly 1 minute', () => {
    const oneMinAgo = new Date(Date.now() - 65 * 1000).toISOString();
    expect(formatRelativeTime(oneMinAgo)).toBe('1 minute ago');
  });

  it('returns "Today at ..." for same day', () => {
    const todayEarlier = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(todayEarlier)).toMatch(/Today at/);
  });

  it('returns "Yesterday" for previous day', () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(yesterday)).toBe('Yesterday');
  });
});

// ─── getInitials ──────────────────────────────────────────────────────────────

describe('getInitials', () => {
  it('returns two initials for full name', () => {
    expect(getInitials('Michael Okolo')).toBe('MO');
  });

  it('returns single initial for single name', () => {
    expect(getInitials('Michael')).toBe('M');
  });

  it('returns first initial for email', () => {
    expect(getInitials('michael@fynfloo.com')).toBe('M');
  });

  it('returns uppercase initials', () => {
    expect(getInitials('alice bob')).toBe('AB');
  });
});
