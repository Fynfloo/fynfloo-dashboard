// features/onboarding/hooks/useOnboarding.ts
import { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { setAccessToken } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { Store } from '@/lib/types';

type CreateTenantResponse = {
  ok: boolean;
  tenantId: string;
  slug: string;
  accessToken: string;
  expiresIn: number;
};

type SubdomainCheckResponse = {
  available: boolean;
};

type OnboardingData = {
  storeName: string;
  subdomain: string;
  templateKey: string;
  businessType: string;
  currency: string;
};

export function useOnboarding() {
  const [isPending, setIsPending] = useState(false);
  const { setStores, stores } = useAuthStore();

  async function checkSubdomain(subdomain: string): Promise<boolean> {
    if (!subdomain) return false;
    try {
      const res = await apiRequest<SubdomainCheckResponse>(
        `/api/tenant/check-subdomain?subdomain=${subdomain}`,
      );
      return res.available;
    } catch {
      return false;
    }
  }

  async function createStore(data: OnboardingData): Promise<string> {
    setIsPending(true);
    try {
      const res = await apiRequest<CreateTenantResponse>('/api/tenant/create', {
        method: 'POST',
        body: {
          storeName: data.storeName,
          subdomain: data.subdomain,
          templateKey: data.templateKey,
          businessType: data.businessType,
        },
      });

      // Update access token — new JWT includes tenant claim
      setAccessToken(res.accessToken, res.expiresIn);

      // Update stores in Zustand
      const newStore: Store = {
        id: res.tenantId,
        name: data.storeName,
        subdomain: data.subdomain,
        currency: data.currency,
      };
      setStores([...stores, newStore]);

      return res.tenantId;
    } finally {
      setIsPending(false);
    }
  }

  return { checkSubdomain, createStore, isPending };
}
