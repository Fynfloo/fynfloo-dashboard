// features/auth/components/ForgotPasswordForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { AlertCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type Fields = z.infer<typeof schema>;

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState({ email }: { email: string }) {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--accent-dim)' }}
      >
        <Mail className="h-7 w-7" style={{ color: 'var(--accent)' }} />
      </div>

      <div className="space-y-1.5">
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
        >
          Check your email
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          If an account exists for{' '}
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {email}
          </span>
          , you will receive a password reset link shortly.
        </p>
      </div>

      <div
        className="w-full rounded-[var(--radius-md)] px-4 py-3 text-sm text-left"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--bg-border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        Can&apos;t find it? Check your spam folder. The link expires in 1 hour.
      </div>

      <Link href="/login" className="w-full">
        <Button size="lg" className="w-full h-11 text-base">
          Back to sign in
        </Button>
      </Link>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const { forgotPassword, isPending } = useForgotPassword();

  const form = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: Fields) {
    try {
      await forgotPassword(data.email);
      setSubmittedEmail(data.email);
    } catch {
      // Backend always returns ok:true even if email not found
      // to prevent email enumeration — so we always show success
      setSubmittedEmail(data.email);
    }
  }

  return (
    <div
      className="rounded-2xl p-10 w-full"
      style={{
        background: 'var(--bg-surface)',
        boxShadow: '0 8px 60px rgba(0,0,0,0.4)',
      }}
    >
      {submittedEmail ? (
        <SuccessState email={submittedEmail} />
      ) : (
        <div className="space-y-7">
          <div className="space-y-1.5 text-center">
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
            >
              Reset your password
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          {form.formState.errors.root && (
            <div
              className="flex items-start gap-2.5 rounded-[var(--radius-md)] px-3.5 py-3 text-sm"
              style={{
                background: 'var(--red-bg)',
                border: '1px solid var(--red-border)',
                color: 'var(--red)',
              }}
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{form.formState.errors.root.message}</span>
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="email" className="block mb-2">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                error={!!form.formState.errors.email}
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p
                  className="flex items-center gap-1 mt-1.5 text-xs"
                  style={{ color: 'var(--red)' }}
                >
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-11 text-base"
              loading={isPending}
              disabled={isPending}
            >
              {isPending ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>

          <p
            className="text-center text-sm pt-6"
            style={{
              color: 'var(--text-secondary)',
              borderTop: '1px solid var(--bg-border-subtle)',
            }}
          >
            Remember your password?{' '}
            <Link
              href="/login"
              className="font-medium hover:underline transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
