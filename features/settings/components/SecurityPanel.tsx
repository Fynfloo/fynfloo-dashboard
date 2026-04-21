// features/settings/components/SecurityPanel.tsx
'use client';

import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export function SecurityPanel() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-xl space-y-6">
      {/* MFA */}
      <div
        className="rounded-[var(--radius-lg)] p-5 space-y-4"
        style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Two-factor authentication
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Add an extra layer of security to your account with an authenticator app.
            </p>
          </div>
          {user?.mfaEnabled ? (
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
              style={{ background: 'var(--green-bg)', color: 'var(--green)' }}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Enabled
            </span>
          ) : (
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
              style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Not enabled
            </span>
          )}
        </div>

        {!user?.mfaEnabled && (
          <div
            className="rounded-[var(--radius-md)] px-4 py-3 text-sm"
            style={{
              background: 'var(--amber-bg)',
              color: 'var(--amber)',
              border: '1px solid var(--amber-border)',
            }}
          >
            2FA must be enabled before you can connect Stripe and receive payments.
          </div>
        )}

        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          MFA management UI (enable, disable, backup codes) is available from the security section
          built in Step 7. Full UI will be surfaced here in an upcoming update.
        </p>
      </div>

      {/* Active sessions */}
      <div
        className="rounded-[var(--radius-lg)] p-5"
        style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
      >
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          Active sessions
        </p>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          View and revoke active login sessions across all your devices.
        </p>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Session management UI is coming in an upcoming update. The backend session endpoints were
          built in Step 7.
        </p>
      </div>
    </div>
  );
}
