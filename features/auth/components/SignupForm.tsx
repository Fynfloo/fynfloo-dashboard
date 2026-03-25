// features/auth/components/SignupForm.tsx
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
import { useSignup } from '@/features/auth/hooks/useSignup';

// ─── Schema ───────────────────────────────────────────────────────────────────

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

type SignupFields = z.infer<typeof signupSchema>;

// ─── Shared pieces ────────────────────────────────────────────────────────────

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: 'var(--red)' }}>
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

function ConfirmPrompt({ email }: { email: string }) {
  return (
    <div className="space-y-6 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
        style={{ background: 'var(--accent-dim)' }}
      >
        <Mail className="h-7 w-7" style={{ color: 'var(--accent)' }} />
      </div>

      <div className="space-y-2">
        <h2
          className="text-xl font-bold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}
        >
          Check your email
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          We sent a confirmation link to
        </p>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {email}
        </p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Click the link in the email to activate your account. The link expires in 1 hour.
        </p>
      </div>

      <div
        className="rounded-[var(--radius-md)] px-4 py-3 text-sm text-left"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--bg-border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        Can&apos;t find it? Check your spam folder or{' '}
        <span style={{ color: 'var(--text-primary)' }}>contact support</span>.
      </div>

      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Already confirmed?{' '}
        <Link
          href="/login"
          className="font-medium hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SignupForm() {
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);
  const { signup, isPending } = useSignup();

  const form = useForm<SignupFields>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  async function onSubmit(data: SignupFields) {
    try {
      await signup(data);
      setConfirmedEmail(data.email);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      form.setError('root', {
        message: e?.message ?? 'Something went wrong — please try again',
      });
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
      {confirmedEmail ? (
        <ConfirmPrompt email={confirmedEmail} />
      ) : (
        <div className="space-y-7">
          <div className="space-y-1.5 text-center">
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
            >
              Create your account
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Start selling in minutes — no credit card required
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
              <Label htmlFor="name" className="block mb-2">
                Full name
              </Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                autoFocus
                placeholder="John Doe"
                error={!!form.formState.errors.name}
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <FieldError message={form.formState.errors.name.message!} />
              )}
            </div>

            <div>
              <Label htmlFor="email" className="block mb-2">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={!!form.formState.errors.email}
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <FieldError message={form.formState.errors.email.message!} />
              )}
            </div>

            <div>
              <Label htmlFor="password" className="block mb-2">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                error={!!form.formState.errors.password}
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <FieldError message={form.formState.errors.password.message!} />
              )}
              {!form.formState.errors.password && (
                <p className="mt-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  At least 8 characters, one uppercase, one number
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
              {isPending ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p
            className="text-center text-sm pt-6"
            style={{
              color: 'var(--text-secondary)',
              borderTop: '1px solid var(--bg-border-subtle)',
            }}
          >
            Already have an account?{' '}
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
