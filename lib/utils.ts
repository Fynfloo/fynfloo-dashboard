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
  const parts = nameOrEmail.split(/[\s@]+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
