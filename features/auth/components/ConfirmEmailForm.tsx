// features/auth/components/ConfirmEmailForm.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfirmEmail } from '@/features/auth/hooks/useConfirmEmail';

export function ConfirmEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const uid = searchParams.get('uid') ?? '';

  const { confirmEmail, status } = useConfirmEmail();

  // Auto-submit on load — no user action needed
  useEffect(() => {
    if (token && uid) {
      confirmEmail(token, uid);
    }
  }, [token, uid]);

  return (
    <div
      className="rounded-2xl p-10 w-full"
      style={{
        background: 'var(--bg-surface)',
        boxShadow: '0 8px 60px rgba(0,0,0,0.4)',
      }}
    >
      {/* Loading */}
      {(status === 'idle' || status === 'loading') && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin" style={{ color: 'var(--accent)' }} />
          <div className="space-y-1">
            <p
              className="text-base font-semibold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Confirming your email…
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              This will only take a moment
            </p>
          </div>
        </div>
      )}

      {/* Success */}
      {status === 'success' && (
        <div className="flex flex-col items-center gap-6 py-4 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(5,150,105,0.1)' }}
          >
            <CheckCircle className="h-7 w-7" style={{ color: 'var(--green)' }} />
          </div>

          <div className="space-y-1.5">
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
            >
              Email confirmed
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Your account is active. You can now sign in.
            </p>
          </div>

          <Link href="/login" className="w-full">
            <Button size="lg" className="w-full h-11 text-base">
              Continue to sign in
            </Button>
          </Link>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-6 py-4 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--red-bg)' }}
          >
            <XCircle className="h-7 w-7" style={{ color: 'var(--red)' }} />
          </div>

          <div className="space-y-1.5">
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
            >
              Link expired
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              This confirmation link is invalid or has expired. Confirmation links are valid for 1
              hour.
            </p>
          </div>

          <div className="w-full space-y-3">
            <Link href="/signup" className="w-full">
              <Button size="lg" className="w-full h-11 text-base">
                Create a new account
              </Button>
            </Link>
            <Link
              href="/login"
              className="block text-sm text-center hover:underline transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Back to sign in
            </Link>
          </div>
        </div>
      )}

      {/* No token in URL */}
      {!token && !uid && status === 'idle' && (
        <div className="flex flex-col items-center gap-6 py-4 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--red-bg)' }}
          >
            <XCircle className="h-7 w-7" style={{ color: 'var(--red)' }} />
          </div>
          <div className="space-y-1.5">
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
            >
              Invalid link
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              This confirmation link is missing required parameters.
            </p>
          </div>
          <Link href="/signup" className="w-full">
            <Button size="lg" className="w-full h-11 text-base">
              Back to signup
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
