// features/settings/hooks/useSettings.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import type { StoreSettings, UpdateSettingsInput, StripeConnectStatus } from '@/lib/types';
import { apiRequest, getAccessToken } from '@/lib/api';

// ─── API functions ────────────────────────────────────────────────────────────

export async function getStoreSettings(tenantId: string): Promise<StoreSettings> {
  return apiRequest<StoreSettings>(`/api/tenant/${tenantId}/settings`);
}

export async function updateStoreSettings(
  tenantId: string,
  input: UpdateSettingsInput,
): Promise<StoreSettings> {
  return apiRequest<StoreSettings>(`/api/tenant/${tenantId}/settings`, {
    method: 'PATCH',
    body: input,
  });
}

export async function updateThemeSettings(
  tenantId: string,
  themeSettings: Record<string, unknown>,
): Promise<{ id: string; themeSettings: Record<string, unknown> | null }> {
  return apiRequest(`/api/tenant/${tenantId}/settings/theme`, {
    method: 'PATCH',
    body: { themeSettings },
  });
}

// ─── Stripe Connect API functions ─────────────────────────────────────────────

export async function getStripeConnectStatus(tenantId: string): Promise<StripeConnectStatus> {
  return apiRequest<StripeConnectStatus>(`/api/payments/dashboard/${tenantId}/connect-status`);
}

/**
 * Syncs live Stripe status into DB.
 * Called on return from Stripe onboarding — ensures stripeChargesEnabled
 * is updated before the webhook arrives.
 */
export async function syncStripeConnectStatus(tenantId: string): Promise<StripeConnectStatus> {
  return apiRequest<StripeConnectStatus>(
    `/api/payments/dashboard/${tenantId}/sync-connect-status`,
    { method: 'POST' },
  );
}

export async function createStripeConnectAccount(tenantId: string): Promise<{ accountId: string }> {
  return apiRequest(`/api/payments/dashboard/${tenantId}/create-connect-account`, {
    method: 'POST',
  });
}

export async function createStripeAccountLink(tenantId: string): Promise<{ url: string }> {
  return apiRequest(`/api/payments/dashboard/${tenantId}/create-account-link`, {
    method: 'POST',
  });
}

// ─── useSettings ──────────────────────────────────────────────────────────────

export function useSettings(tenantId: string) {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStoreSettings(tenantId);
      setSettings(data);
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function saveSettings(input: UpdateSettingsInput): Promise<boolean> {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateStoreSettings(tenantId, input);
      setSettings(updated);
      return true;
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to save settings');
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function saveTheme(themeSettings: Record<string, unknown>): Promise<boolean> {
    setIsSaving(true);
    setError(null);
    try {
      const result = await updateThemeSettings(tenantId, themeSettings);
      setSettings((prev) => (prev ? { ...prev, themeSettings: result.themeSettings } : prev));
      return true;
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to save theme');
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    settings,
    isLoading,
    isSaving,
    error,
    saveSettings,
    saveTheme,
    refetch: fetchSettings,
    setSettings,
  };
}

// ─── useStripeConnect ─────────────────────────────────────────────────────────

/**
 * Manages Stripe Connect status for the payments settings page.
 *
 * On mount:
 *   1. Checks for ?stripe_return=true in URL (merchant returning from Stripe onboarding)
 *   2. If present — calls sync-connect-status to update DB before webhook arrives,
 *      then updates the Zustand store so the nudge banner updates immediately
 *   3. Always fetches live connect-status from Stripe on page load
 *
 * connectStripe():
 *   Creates account if needed, generates onboarding link, redirects to Stripe.
 *   returnUrl is set server-side to /dashboard/:tenantId/settings/payments?stripe_return=true
 */
export function useStripeConnect(tenantId: string) {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setStores = useAuthStore((s) => s.setStores);
  const stores = useAuthStore((s) => s.stores);
  const searchParams = useSearchParams();

  const fetchStatus = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStripeConnectStatus(tenantId);
      setStatus(data);
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to load Stripe status');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    async function init() {
      if (!tenantId) return;

      const isReturn = searchParams?.get('stripe_return') === 'true';

      if (isReturn) {
        // Merchant just returned from Stripe onboarding.
        // Sync live status into DB immediately — don't wait for webhook.
        setIsLoading(true);
        try {
          const synced = await syncStripeConnectStatus(tenantId);
          setStatus(synced);

          // Update the Zustand store so the nudge banner reflects new status
          // without requiring a full page reload.
          if (synced.connected) {
            setStores(
              stores.map((s) =>
                s.id === tenantId ? { ...s, stripeChargesEnabled: synced.chargesEnabled } : s,
              ),
            );
          }
        } catch {
          // Sync failed — fall through to normal fetch
          await fetchStatus();
        } finally {
          setIsLoading(false);
        }
      } else {
        await fetchStatus();
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  /**
   * Creates a Connect account if the merchant doesn't have one,
   * then generates an onboarding link and redirects to Stripe.
   * returnUrl (set server-side) points back to payments page with ?stripe_return=true.
   * No finally — page navigates away on success.
   */
  async function connectStripe(): Promise<void> {
    setIsConnecting(true);
    setError(null);
    try {
      if (!status?.connected) {
        await createStripeConnectAccount(tenantId);
      }
      const { url } = await createStripeAccountLink(tenantId);
      window.location.href = url;
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to connect Stripe');
      setIsConnecting(false);
    }
  }

  return {
    status,
    isLoading,
    isConnecting,
    error,
    connectStripe,
    refetch: fetchStatus,
  };
}

export async function uploadLogo(tenantId: string, file: File): Promise<StoreSettings> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAccessToken();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/tenant/${tenantId}/settings/logo`,
    {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: 'application/json',
      },
      credentials: 'include',
      body: formData,
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error ?? 'Upload failed');
  }

  return res.json();
}

export async function deleteLogo(tenantId: string): Promise<StoreSettings> {
  return apiRequest<StoreSettings>(`/api/tenant/${tenantId}/settings/logo`, {
    method: 'DELETE',
  });
}
