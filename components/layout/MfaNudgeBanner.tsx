// components/layout/MfaNudgeBanner.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentStore } from '@/hooks/useStore';

export function MfaNudgeBanner() {
  const user = useAuthStore((s) => s.user);
  const store = useCurrentStore();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if MFA enabled, no user, or dismissed this session
  if (!user || user.mfaEnabled || dismissed) return null;

  const securityHref = store ? `/dashboard/${store.id}/settings/security` : '/dashboard';

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 text-sm"
      style={{
        background: 'var(--amber-bg)',
        borderBottom: '1px solid var(--amber-border)',
        color: 'var(--amber)',
      }}
    >
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <p className="flex-1">
        Your account is not protected with two-factor authentication.{' '}
        <Link href={securityHref} className="font-medium underline underline-offset-2">
          Enable 2FA now
        </Link>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-0.5 rounded transition-colors"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--amber-border)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
