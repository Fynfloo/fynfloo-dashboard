// features/auth/components/ResetPasswordForm.tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResetPassword } from '@/features/auth/hooks/useResetPassword';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type Fields = z.infer<typeof schema>;

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState() {
  return (
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
          Password updated
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Your password has been reset successfully. You can now sign in with your new password.
        </p>
      </div>

      <Link href="/login" className="w-full">
        <Button size="lg" className="w-full h-11 text-base">
          Continue to sign in
        </Button>
      </Link>
    </div>
  );
}

// ─── Invalid link state ───────────────────────────────────────────────────────

function InvalidState() {
  return (
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
          Invalid reset link
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          This password reset link is invalid or has expired. Reset links are valid for 1 hour.
        </p>
      </div>

      <div className="w-full space-y-3">
        <Link href="/forgot-password" className="w-full">
          <Button size="lg" className="w-full h-11 text-base">
            Request a new link
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
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const uid = searchParams.get('uid') ?? '';

  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword, isPending } = useResetPassword();

  const form = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  // No token or uid in URL
  if (!token || !uid) {
    return (
      <div
        className="rounded-2xl p-10 w-full"
        style={{
          background: 'var(--bg-surface)',
          boxShadow: '0 8px 60px rgba(0,0,0,0.4)',
        }}
      >
        <InvalidState />
      </div>
    );
  }

  async function onSubmit(data: Fields) {
    try {
      await resetPassword({ token, uid, newPassword: data.newPassword });
      setIsSuccess(true);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 400) {
        form.setError('root', {
          message: 'This reset link is invalid or has expired. Please request a new one.',
        });
        return;
      }
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
      {isSuccess ? (
        <SuccessState />
      ) : (
        <div className="space-y-7">
          <div className="space-y-1.5 text-center">
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
            >
              Set new password
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Choose a strong password for your account
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
              <Label htmlFor="newPassword" className="block mb-2">
                New password
              </Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                autoFocus
                placeholder="Min. 8 characters"
                error={!!form.formState.errors.newPassword}
                {...form.register('newPassword')}
              />
              {form.formState.errors.newPassword ? (
                <p
                  className="flex items-center gap-1 mt-1.5 text-xs"
                  style={{ color: 'var(--red)' }}
                >
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {form.formState.errors.newPassword.message}
                </p>
              ) : (
                <p className="mt-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  At least 8 characters, one uppercase, one number
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="block mb-2">
                Confirm new password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                error={!!form.formState.errors.confirmPassword}
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword && (
                <p
                  className="flex items-center gap-1 mt-1.5 text-xs"
                  style={{ color: 'var(--red)' }}
                >
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {form.formState.errors.confirmPassword.message}
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
              {isPending ? 'Updating password…' : 'Update password'}
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
