'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useCurrentStore } from '@/hooks/useStore';
import { apiRequest } from '@/lib/api';
import type { StorefrontPreviewSession } from '@/lib/types';
import { buildStorefrontPreviewUrl } from '@/features/settings/lib/storefrontEditor';
import { resolvePreviewMessageTargetOrigin } from '../lib/previewBridge';

const CONFIGURED_PREVIEW_ORIGIN = process.env.NEXT_PUBLIC_STOREFRONT_EDITOR_ORIGIN;

async function createStorefrontPreviewSession(
  tenantId: string,
): Promise<StorefrontPreviewSession> {
  return apiRequest<StorefrontPreviewSession>(
    `/api/tenant/${tenantId}/settings/storefront/preview-session`,
    { method: 'POST' },
  );
}

function subscribeToLocationOrigin(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('popstate', cb);
  return () => window.removeEventListener('popstate', cb);
}

function getLocationOriginSnapshot(): string | null {
  if (typeof window === 'undefined') return null;
  return window.location.origin;
}

export function usePreviewSession(
  storeId: string,
  previewPath: string,
  requiresPreviewToken: boolean,
) {
  const currentStore = useCurrentStore();
  const [previewSession, setPreviewSession] = useState<StorefrontPreviewSession | null>(null);
  const [isPreviewSessionLoading, setIsPreviewSessionLoading] = useState(false);
  const [previewSessionError, setPreviewSessionError] = useState<string | null>(null);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  const currentOrigin = useSyncExternalStore(
    subscribeToLocationOrigin,
    getLocationOriginSnapshot,
    () => null,
  );

  const loadPreviewSession = useCallback(async () => {
    if (!storeId) return;
    setIsPreviewSessionLoading(true);
    setPreviewSessionError(null);
    try {
      const session = await createStorefrontPreviewSession(storeId);
      setPreviewSession(session);
    } catch (err) {
      const apiError = err as { message?: string };
      setPreviewSession(null);
      setPreviewSessionError(apiError.message ?? 'Could not open the current page view');
    } finally {
      setIsPreviewSessionLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void loadPreviewSession();
  }, [loadPreviewSession]);

  useEffect(() => {
    if (!previewSession?.expiresAt) return;
    const expiresAtMs = new Date(previewSession.expiresAt).getTime();
    if (Number.isNaN(expiresAtMs)) return;
    const refreshDelayMs = Math.max(expiresAtMs - Date.now() - 60_000, 0);
    const timer = window.setTimeout(() => void loadPreviewSession(), refreshDelayMs);
    return () => window.clearTimeout(timer);
  }, [loadPreviewSession, previewSession?.expiresAt]);

  const previewUrl = useMemo(
    () =>
      buildStorefrontPreviewUrl({
        subdomain: currentStore?.subdomain ?? null,
        path: previewPath,
        currentOrigin,
        configuredOrigin: CONFIGURED_PREVIEW_ORIGIN,
        previewToken: previewSession?.token ?? null,
        requiresPreviewToken: Boolean(currentStore?.subdomain) || requiresPreviewToken,
      }),
    [currentOrigin, currentStore?.subdomain, previewSession?.token, previewPath, requiresPreviewToken],
  );

  const previewMessagingOrigin = useMemo(
    () => resolvePreviewMessageTargetOrigin(previewUrl.url),
    [previewUrl.url],
  );

  const previewSessionNote = previewSessionError
    ? `Current page unavailable: ${previewSessionError}`
    : isPreviewSessionLoading
      ? 'Opening your site view…'
      : null;

  const refreshPreview = useCallback(() => setPreviewRefreshKey((k) => k + 1), []);

  return {
    previewSession,
    isPreviewSessionLoading,
    previewSessionError,
    previewRefreshKey,
    previewUrl,
    previewMessagingOrigin,
    previewSessionNote,
    refreshPreview,
  };
}
