// components/shared/AuthInitialiser.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { silentRefresh, getAccessToken, isTokenExpiringSoon, apiRequest } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { useAuthStore } from '@/store/auth.store';
import type { StoresResponse } from '@/lib/types';

const PUBLIC_PATHS = ['/login', '/signup', '/confirm-email', '/forgot-password', '/reset-password'];

/**
 * AuthInitialiser — restores merchant session on app load.
 *
 * Runs once on mount (isInitialised guard prevents re-runs on navigation).
 *
 * Flow:
 *   1. If access token already in memory and not expiring soon → hydrate
 *   2. If access token expiring soon → refresh first, then hydrate
 *   3. If no access token → silent refresh via httpOnly cookie
 *      → success: hydrate user and stores
 *      → failure: redirect to login (unless on public path)
 *
 * Proactive refresh chain:
 *   setAccessToken (called inside silentRefresh) schedules a timer
 *   to refresh 30 seconds before the access token expires.
 *   This chain self-sustains while the tab is open — merchants
 *   never see a 401 from an expired token during active use.
 */
export function AuthInitialiser({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setStores, setLoading, setInitialised, reset, isInitialised } = useAuthStore();

  useEffect(() => {
    async function init() {
      const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

      // Already initialised — don't re-run on navigation
      if (isInitialised) return;

      // Access token in memory — check if it's still valid
      if (getAccessToken()) {
        // Token expiring soon — refresh before hydrating
        if (isTokenExpiringSoon()) {
          const refreshed = await silentRefresh();
          if (!refreshed) {
            reset();
            if (!isPublic) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
            return;
          }
        }

        // Hydrate user and stores from valid token
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

      // No access token in memory — attempt silent refresh via httpOnly cookie.
      // silentRefresh calls setAccessToken on success which:
      //   1. Stores the new token in memory
      //   2. Schedules the proactive refresh timer automatically
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
