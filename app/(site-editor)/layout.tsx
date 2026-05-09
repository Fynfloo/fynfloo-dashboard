'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function SiteEditorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialised = useAuthStore((state) => state.isInitialised);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isInitialised) return;
    if (!user) {
      router.replace('/login');
    }
  }, [isInitialised, router, user]);

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

  if (!user) return null;

  return (
    <div className="h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {children}
    </div>
  );
}
