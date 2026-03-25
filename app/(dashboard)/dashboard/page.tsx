// app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardIndexPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const stores = useAuthStore((s) => s.stores);
  const isInitialised = useAuthStore((s) => s.isInitialised);

  useEffect(() => {
    if (!isInitialised) return;

    // Not authenticated — AuthInitialiser handles redirect to /login
    // but we guard here too just in case
    if (!user) {
      router.replace('/login');
      return;
    }

    if (stores.length === 0) {
      router.replace('/onboarding');
    } else {
      router.replace(`/dashboard/${stores[0].id}`);
    }
  }, [isInitialised, stores]);

  return (
    <div className="flex items-center justify-center h-full">
      <div
        className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
      />
    </div>
  );
}
