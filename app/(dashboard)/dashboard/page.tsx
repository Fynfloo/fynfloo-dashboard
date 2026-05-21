// app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardIndexPage() {
  const router = useRouter();
  const stores = useAuthStore((s) => s.stores);

  useEffect(() => {
    if (stores.length > 0) {
      router.replace(`/dashboard/${stores[0].id}`);
    }
    // stores.length === 0 is handled by DashboardLayout
  }, [stores]);

  return (
    <div className="flex items-center justify-center h-full">
      <div
        className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
      />
    </div>
  );
}
