// features/settings/components/StripeConnectPanel.tsx
'use client';

import { CheckCircle, AlertCircle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { useStripeConnect } from '../hooks/useSettings';
import { useAuthStore } from '@/store/auth.store';

interface Props {
  storeId: string;
}

function CapabilityRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span
        className="flex items-center gap-1.5 text-xs font-medium"
        style={{ color: enabled ? 'var(--green)' : 'var(--amber)' }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: enabled ? 'var(--green)' : 'var(--amber)' }}
        />
        {enabled ? 'Active' : 'Pending'}
      </span>
    </div>
  );
}

export function StripeConnectPanel({ storeId }: Props) {
  const { status, isLoading, isConnecting, error, connectStripe, refetch } =
    useStripeConnect(storeId);

  const user = useAuthStore((s) => s.user);
  const mfaRequired = !user?.mfaEnabled;

  // Discriminated union narrowing — no any needed
  const isConnected = status?.connected === true;
  const chargesEnabled = isConnected && status.connected && status.chargesEnabled;
  const payoutsEnabled = isConnected && status.connected && status.payoutsEnabled;
  const detailsSubmitted = isConnected && status.connected && status.detailsSubmitted;

  if (isLoading) {
    return (
      <div className="max-w-xl animate-pulse">
        <div
          className="h-40 rounded-[var(--radius-lg)]"
          style={{ background: 'var(--bg-elevated)' }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      {error && (
        <div
          className="px-4 py-3 rounded-[var(--radius-md)] text-sm"
          style={{
            background: 'var(--red-bg)',
            color: 'var(--red)',
            border: '1px solid var(--red-border)',
          }}
        >
          {error}
        </div>
      )}

      {/* Status card */}
      <div
        className="rounded-[var(--radius-lg)] p-5 space-y-4"
        style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Stripe
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Accept card payments from your customers via Stripe Connect.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Refresh status */}
            <button
              onClick={refetch}
              className="p-1.5 rounded-[var(--radius-md)] transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-elevated)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
              title="Refresh status"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            {isConnected ? (
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: 'var(--green-bg)', color: 'var(--green)' }}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Connected
              </span>
            ) : (
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                Not connected
              </span>
            )}
          </div>
        </div>

        {/* Capabilities — shown when connected */}
        {isConnected && (
          <div
            className="rounded-[var(--radius-md)] p-3 space-y-2.5"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <CapabilityRow label="Card payments" enabled={chargesEnabled} />
            <CapabilityRow label="Payouts to bank" enabled={payoutsEnabled} />
            {!detailsSubmitted && (
              <p className="text-xs pt-1" style={{ color: 'var(--text-secondary)' }}>
                Stripe is still reviewing your details. This may take a few minutes.
              </p>
            )}
            {detailsSubmitted && !chargesEnabled && (
              <p className="text-xs pt-1" style={{ color: 'var(--text-secondary)' }}>
                Complete your Stripe onboarding to activate card payments.
              </p>
            )}
          </div>
        )}

        {/* MFA gate — shown only when not connected and MFA is off */}
        {!isConnected && mfaRequired && (
          <div
            className="flex items-start gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 text-sm"
            style={{
              background: 'var(--amber-bg)',
              color: 'var(--amber)',
              border: '1px solid var(--amber-border)',
            }}
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Two-factor authentication is required before connecting Stripe.{' '}
              <a
                href={`/dashboard/${storeId}/settings/security`}
                className="font-medium underline underline-offset-2"
              >
                Enable 2FA first
              </a>
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          {
            !isConnected ? (
              // ── Not connected — show Connect button
              <button
                onClick={connectStripe}
                disabled={isConnecting || mfaRequired}
                className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-opacity"
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  opacity: isConnecting || mfaRequired ? 0.5 : 1,
                  cursor: isConnecting || mfaRequired ? 'not-allowed' : 'pointer',
                }}
              >
                {isConnecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isConnecting ? 'Redirecting to Stripe…' : 'Connect Stripe'}
                {!isConnecting && <ExternalLink className="h-3.5 w-3.5" />}
              </button>
            ) : !chargesEnabled ? (
              // ── Connected but onboarding incomplete — show Resume button
              <button
                onClick={connectStripe}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-opacity"
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  opacity: isConnecting ? 0.5 : 1,
                  cursor: isConnecting ? 'not-allowed' : 'pointer',
                }}
              >
                {isConnecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isConnecting ? 'Redirecting…' : 'Resume onboarding'}
                {!isConnecting && <ExternalLink className="h-3.5 w-3.5" />}
              </button>
            ) : null
            // ── Fully connected and active — no action needed
          }
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Fynfloo uses Stripe Connect to process payments on your behalf. Funds are paid out to your
        bank account on Stripe&apos;s standard payout schedule. To disconnect Stripe, go to your
        Stripe dashboard under Settings → Connected Apps.
      </p>
    </div>
  );
}
