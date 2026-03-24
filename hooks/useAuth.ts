// hooks/useAuth.ts
import { useAuthStore } from '@/store/auth.store';

/**
 * Returns the current authenticated user and store list.
 * Reads from Zustand — populated on app init by AuthProvider.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const stores = useAuthStore((s) => s.stores);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialised = useAuthStore((s) => s.isInitialised);

  return { user, stores, isLoading, isInitialised };
}
