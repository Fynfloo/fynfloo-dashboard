// app/(dashboard)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const stores = useAuthStore((s) => s.stores);
  const isInitialised = useAuthStore((s) => s.isInitialised);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isInitialised) return;
    if (!user) { router.replace('/login'); return; }
    if (stores.length === 0) { router.replace('/onboarding'); return; }
  }, [isInitialised, user, stores]);

  // Wait for auth — prevents any flash
  if (!isInitialised || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-base)' }}
      >
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // Render nothing while redirects fire
  if (!user || stores.length === 0) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
