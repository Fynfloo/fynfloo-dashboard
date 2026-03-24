// hooks/useStore.ts
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

/**
 * Returns the current store based on the [storeId] URL param.
 * Returns null if storeId not in URL or store not found.
 */
export function useCurrentStore() {
  const params = useParams();
  const stores = useAuthStore((s) => s.stores);
  const storeId = params?.storeId as string | undefined;

  if (!storeId) return null;
  return stores.find((s) => s.id === storeId) ?? null;
}
