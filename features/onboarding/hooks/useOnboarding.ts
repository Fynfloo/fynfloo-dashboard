'use client';
import { useState } from 'react';
import { apiRequest, setAccessToken } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { Store } from '@/lib/types';

type CreateTenantResponse = {
  ok: boolean;
  tenantId: string;
  slug: string;
  accessToken: string;
  expiresIn: number;
};

type SubdomainCheckResponse = { available: boolean };

export type OnboardingInput = {
  storeName: string;
  subdomain: string;
  templateKey: string;
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

  async function createBusiness(input: OnboardingInput): Promise<string> {
    setIsPending(true);
    try {
      // 1. Create tenant
      const res = await apiRequest<CreateTenantResponse>('/api/tenant/create', {
        method: 'POST',
        body: { storeName: input.storeName, subdomain: input.subdomain },
      });

      // 2. Update token so apply-template call is authenticated
      setAccessToken(res.accessToken, res.expiresIn);

      // 3. Apply template — creates V2 pages + shell
      await apiRequest(`/api/business/${res.tenantId}/apply-template`, {
        method: 'POST',
        body: { templateKey: input.templateKey },
      });

      // 4. Update local store list
      const newStore: Store = {
        id: res.tenantId,
        name: input.storeName,
        subdomain: input.subdomain,
        currency: 'GBP',
        stripeChargesEnabled: false,
      };
      setStores([...stores, newStore]);

      return res.tenantId;
    } finally {
      setIsPending(false);
    }
  }

  return { checkSubdomain, createBusiness, isPending };
}
