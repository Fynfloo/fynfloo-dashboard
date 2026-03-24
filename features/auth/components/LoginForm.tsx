// features/auth/components/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin, useMfaVerify } from '@/features/auth/hooks/useLogin';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const mfaSchema = z.object({
  code: z
    .string()
    .min(6, 'Code must be 6 digits')
    .max(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must be numeric'),
});

type LoginFields = z.infer<typeof loginSchema>;
type MfaFields = z.infer<typeof mfaSchema>;
type Step = 'password' | 'mfa';

// ─── Small shared pieces ──────────────────────────────────────────────────────

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: 'var(--red)' }}>
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

function Banner({
  message,
  variant = 'error',
}: {
  message: string;
  variant?: 'error' | 'warning';
}) {
  const isWarning = variant === 'warning';
  return (
    <div
      className="flex items-start gap-2.5 rounded-[var(--radius-md)] px-3.5 py-3 text-sm"
      style={{
        background: isWarning ? 'var(--amber-bg)' : 'var(--red-bg)',
        border: `1px solid ${isWarning ? 'var(--amber-border)' : 'var(--red-border)'}`,
        color: isWarning ? 'var(--amber)' : 'var(--red)',
      }}
    >
      {isWarning ? (
        <Clock className="h-4 w-4 shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      )}
      <span>{message}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';

  const [step, setStep] = useState<Step>('password');
  const [mfaToken, setMfaToken] = useState('');
  const [lockoutMessage, setLockoutMessage] = useState('');

  const { login, isPending: isLoginPending } = useLogin();
  const { verifyMfa, isPending: isMfaPending } = useMfaVerify();

  const loginForm = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mfaForm = useForm<MfaFields>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: '' },
  });

  async function onLoginSubmit(data: LoginFields) {
    setLockoutMessage('');
    try {
      const result = await login(data);
      if (result.requiresMfa) {
        setMfaToken(result.mfaToken);
        setStep('mfa');
      } else {
        router.replace(next);
      }
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 423) {
        setLockoutMessage(e.message ?? 'Account temporarily locked');
        return;
      }
      loginForm.setError('root', {
        message: e?.message ?? 'Invalid email or password',
      });
    }
  }

  async function onMfaSubmit(data: MfaFields) {
    try {
      await verifyMfa({ mfaToken, totpCode: data.code });
      router.replace(next);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      mfaForm.setError('root', {
        message: e?.message ?? 'Invalid code — try again',
      });
    }
  }

  return (
    <div
      className="rounded-[var(--radius-xl)] p-8 space-y-6 w-full"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border-subtle)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {step === 'password' ? (
        <>
          <div className="space-y-1">
            <h1
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.022em' }}
            >
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sign in to your Fynfloo account
            </p>
          </div>

          {lockoutMessage && <Banner message={lockoutMessage} variant="warning" />}
          {loginForm.formState.errors.root && (
            <Banner message={loginForm.formState.errors.root.message!} />
          )}

          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email" className="block mb-1.5">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                error={!!loginForm.formState.errors.email}
                {...loginForm.register('email')}
              />
              {loginForm.formState.errors.email && (
                <FieldError message={loginForm.formState.errors.email.message!} />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs transition-colors hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={!!loginForm.formState.errors.password}
                {...loginForm.register('password')}
              />
              {loginForm.formState.errors.password && (
                <FieldError message={loginForm.formState.errors.password.message!} />
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={isLoginPending}
              disabled={isLoginPending}
            >
              {isLoginPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium hover:underline transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              Create one
            </Link>
          </p>
        </>
      ) : (
        <>
          <div className="space-y-1">
            <h1
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.022em' }}
            >
              Two-factor authentication
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {mfaForm.formState.errors.root && (
            <Banner message={mfaForm.formState.errors.root.message!} />
          )}

          <form onSubmit={mfaForm.handleSubmit(onMfaSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="code" className="block mb-1.5">
                Authentication code
              </Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder="000000"
                maxLength={6}
                error={!!mfaForm.formState.errors.code}
                className="text-center tracking-[0.5em] text-base font-mono"
                {...mfaForm.register('code')}
              />
              {mfaForm.formState.errors.code && (
                <FieldError message={mfaForm.formState.errors.code.message!} />
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={isMfaPending}
              disabled={isMfaPending}
            >
              {isMfaPending ? 'Verifying…' : 'Verify code'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep('password');
                mfaForm.reset();
              }}
              className="w-full text-center text-sm transition-colors hover:underline"
              style={{ color: 'var(--text-secondary)' }}
            >
              ← Back to sign in
            </button>
          </form>
        </>
      )}
    </div>
  );
}
