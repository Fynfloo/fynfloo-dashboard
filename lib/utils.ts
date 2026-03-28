import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a minor unit amount (pence/kobo) to a display string.
 * e.g. 1999 + 'GBP' → '£19.99'
 */
export function formatCurrency(amountMinorUnits: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountMinorUnits / 100);
}

/**
 * Formats an ISO date string to a human-readable date.
 * e.g. '2026-03-24T10:00:00Z' → '24 Mar 2026'
 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/**
 * Formats an ISO date string to date + time.
 * e.g. '2026-03-24T10:00:00Z' → '24 Mar 2026, 10:00'
 */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/**
 * Returns initials from a name or email.
 * e.g. 'Michael Okolo' → 'MO', 'michael@fynfloo.com' → 'M'
 */
export function getInitials(nameOrEmail: string): string {
  // For emails — use only the local part before @
  const input = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail;

  const parts = input.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Returns the currency symbol for a given currency code.
 * e.g. 'GBP' → '£', 'NGN' → '₦'
 */
export function getCurrencySymbol(currency: string): string {
  const map: Record<string, string> = {
    GBP: '£',
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GHS: 'GH₵',
    KES: 'KSh',
    ZAR: 'R',
    CAD: 'CA$',
    AUD: 'A$',
  };
  return map[currency.toUpperCase()] ?? currency;
}

/**
 * Converts minor units (integer) from API to display string.
 * e.g. 4999 → '49.99', 99 → '0.99', 0 → ''
 */
export function formatPriceInput(minorUnits: number | null | undefined): string {
  if (!minorUnits && minorUnits !== 0) return '';
  if (minorUnits === 0) return '';
  return (minorUnits / 100).toFixed(2);
}

/**
 * Converts display string to minor units integer for API.
 * e.g. '49.99' → 4999, '49.' → 4900, '' → 0
 * Uses Math.round to prevent floating point errors.
 */
export function parsePriceInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  if (!cleaned || cleaned === '.') return 0;
  const float = parseFloat(cleaned);
  if (isNaN(float)) return 0;
  return Math.round(float * 100);
}

/**
 * Formats a date as a relative time string.
 * e.g. 'Just now', '2 minutes ago', 'Today at 2:34pm', 'Yesterday', '15 Mar', '15 Mar 2025'
 */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return `Today at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  const sameYear = date.getFullYear() === now.getFullYear();
  if (sameYear) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
