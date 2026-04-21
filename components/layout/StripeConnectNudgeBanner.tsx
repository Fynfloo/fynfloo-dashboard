// components/layout/StripeConnectNudgeBanner.tsx
'use client';

import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { useCurrentStore } from '@/hooks/useStore';

/**
 * Shown when the current store has not completed Stripe onboarding.
 *
 * Reads stripeChargesEnabled from the store list in Zustand auth state —
 * populated by listUserStores which includes the field from the DB.
 * No separate API call is made — the value is updated in DB by the
 * account.updated webhook handler whenever Stripe sends a status change.
 *
 * Not dismissible — disappears automatically once stripeChargesEnabled
 * becomes true (e.g. after merchant completes Stripe onboarding and the
 * webhook fires). Mirrors MfaNudgeBanner in placement and visual weight.
 *
 * Stacks below MfaNudgeBanner in Header.tsx.
 */
export function StripeConnectNudgeBanner() {
  const store = useCurrentStore();

  // No store in context yet (onboarding, auth pages, etc.)
  if (!store) return null;

  // Already fully connected — hide banner
  if (store.stripeChargesEnabled) return null;

  const paymentsHref = `/dashboard/${store.id}/settings/payments`;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 text-sm"
      style={{
        background: 'var(--blue-bg, #eff6ff)',
        borderBottom: '1px solid var(--blue-border, #bfdbfe)',
        color: 'var(--blue, #2563eb)',
      }}
    >
      <CreditCard className="h-4 w-4 shrink-0" />
      <p className="flex-1">
        Your store can&apos;t accept payments yet.{' '}
        <Link href={paymentsHref} className="font-medium underline underline-offset-2">
          Connect Stripe to go live
        </Link>
      </p>
    </div>
  );
}
