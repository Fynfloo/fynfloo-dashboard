// components/shared/AuthInitialiser.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { silentRefresh, getAccessToken, apiRequest } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { useAuthStore } from '@/store/auth.store';
import type { StoresResponse } from '@/lib/types';

const PUBLIC_PATHS = ['/login', '/signup', '/confirm-email', '/forgot-password', '/reset-password'];

export function AuthInitialiser({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setStores, setLoading, setInitialised, reset, isInitialised } = useAuthStore();

  useEffect(() => {
    async function init() {
      const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

      // Already initialised — don't re-run
      if (isInitialised) return;

      // Already have token in memory — hydrate user
      if (getAccessToken()) {
        try {
          const [user, { stores }] = await Promise.all([
            getMe(),
            apiRequest<StoresResponse>('/api/stores'),
          ]);
          setUser(user);
          setStores(stores);
          setInitialised(true);
          setLoading(false);
        } catch {
          reset();
          if (!isPublic) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
        return;
      }

      // Try silent refresh to restore session
      const refreshed = await silentRefresh();

      if (!refreshed) {
        reset();
        if (!isPublic) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      // Hydrate user and stores
      try {
        const [user, { stores }] = await Promise.all([
          getMe(),
          apiRequest<StoresResponse>('/api/stores'),
        ]);
        setUser(user);
        setStores(stores);
        setInitialised(true);
        setLoading(false);
      } catch {
        reset();
        if (!isPublic) router.replace('/login');
      }
    }

    init();
  }, [pathname]);

  return <>{children}</>;
}
