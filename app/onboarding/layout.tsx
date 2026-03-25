'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Image from 'next/image';

// app/onboarding/layout.tsx
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInitialised = useAuthStore((s) => s.isInitialised);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isInitialised) return;
    if (!user) {
      router.replace('/login');
    }
  }, [isInitialised, user]);

  // Show spinner while auth check is in progress
  if (!isInitialised || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-base)' }}
      >
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{
            borderColor: 'var(--accent)',
            borderTopColor: 'transparent',
          }}
        />
      </div>
    );
  }

  // Not authenticated — render nothing while redirect fires
  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Top bar */}
      <header
        className="flex items-center h-14 px-6 shrink-0"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--bg-border-subtle)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <Image src="/logo-1024.png" alt="fynfloo" width={28} height={28} />
          <span
            className="text-base font-bold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}
          >
            fynfloo
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">{children}</div>
    </div>
  );
}
