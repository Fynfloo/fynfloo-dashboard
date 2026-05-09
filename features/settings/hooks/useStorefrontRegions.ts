'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { RegionDocument, RegionKey, RegionMap, StorefrontRegionsState } from '@/lib/types';

const REGION_KEYS: RegionKey[] = [
  'announcement',
  'header',
  'footer',
  'legalFooter',
  'comingSoon',
];

function formatStorefrontRegionsError(err: unknown, fallback: string): string {
  const e = err as { message?: string; status?: number };
  const message = e?.message ?? fallback;

  if (
    message === 'Internal server error' ||
    (typeof e?.status === 'number' && e.status >= 500)
  ) {
    return `${message}. If you just pulled the latest storefront changes, restart the API and apply the newest Prisma migration.`;
  }

  return message;
}

export async function getStorefrontRegions(tenantId: string): Promise<StorefrontRegionsState> {
  return apiRequest<StorefrontRegionsState>(`/api/tenant/${tenantId}/settings/storefront/regions`);
}

export async function updateStorefrontRegion(
  tenantId: string,
  regionKey: RegionKey,
  region: RegionDocument,
): Promise<StorefrontRegionsState> {
  return apiRequest<StorefrontRegionsState>(
    `/api/tenant/${tenantId}/settings/storefront/regions/${regionKey}`,
    {
      method: 'PATCH',
      body: { region },
    },
  );
}

export async function publishStorefrontRegions(tenantId: string): Promise<StorefrontRegionsState> {
  return apiRequest<StorefrontRegionsState>(
    `/api/tenant/${tenantId}/settings/storefront/regions/publish`,
    {
      method: 'POST',
    },
  );
}

export async function discardStorefrontRegionDraft(
  tenantId: string,
): Promise<StorefrontRegionsState> {
  return apiRequest<StorefrontRegionsState>(
    `/api/tenant/${tenantId}/settings/storefront/regions/discard`,
    {
      method: 'POST',
    },
  );
}

export function useStorefrontRegions(tenantId: string) {
  const [regions, setRegions] = useState<StorefrontRegionsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegions = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStorefrontRegions(tenantId);
      setRegions(data);
    } catch (err) {
      setError(formatStorefrontRegionsError(err, 'Failed to load storefront settings'));
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  async function saveDraft(nextDraft: RegionMap): Promise<boolean> {
    setIsSaving(true);
    setError(null);
    try {
      let latest: StorefrontRegionsState | null = null;

      for (const regionKey of REGION_KEYS) {
        const region = nextDraft[regionKey];
        if (!region) continue;
        latest = await updateStorefrontRegion(tenantId, regionKey, region);
      }

      if (latest) {
        setRegions(latest);
      } else {
        await fetchRegions();
      }

      return true;
    } catch (err) {
      setError(formatStorefrontRegionsError(err, 'Failed to save storefront shell'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function publish(): Promise<boolean> {
    setIsPublishing(true);
    setError(null);
    try {
      const result = await publishStorefrontRegions(tenantId);
      setRegions(result);
      return true;
    } catch (err) {
      setError(formatStorefrontRegionsError(err, 'Failed to publish storefront shell'));
      return false;
    } finally {
      setIsPublishing(false);
    }
  }

  async function discard(): Promise<boolean> {
    setIsDiscarding(true);
    setError(null);
    try {
      const result = await discardStorefrontRegionDraft(tenantId);
      setRegions(result);
      return true;
    } catch (err) {
      setError(
        formatStorefrontRegionsError(err, 'Failed to discard storefront shell changes'),
      );
      return false;
    } finally {
      setIsDiscarding(false);
    }
  }

  return {
    regions,
    isLoading,
    isSaving,
    isPublishing,
    isDiscarding,
    error,
    saveDraft,
    publish,
    discard,
    refetch: fetchRegions,
    setRegions,
  };
}
