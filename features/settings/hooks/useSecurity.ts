// features/settings/hooks/useSecurity.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { useAuthStore } from '@/store/auth.store';
import { MfaSetupData, Session } from '@/lib/types';

// ─── useMfa ───────────────────────────────────────────────────────────────────

export function useMfa() {
  const { user, setUser } = useAuthStore();
  const [setupData, setSetupData] = useState<MfaSetupData | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — fetch QR code and secret
  async function startSetup() {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest<MfaSetupData>('/auth/mfa/setup');
      setSetupData(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to start MFA setup');
    } finally {
      setIsLoading(false);
    }
  }

  // Step 2 — verify TOTP and enable
  async function verifyAndEnable(totpCode: string): Promise<boolean> {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest<{ backupCodes: string[] }>('/auth/mfa/verify-setup', {
        method: 'POST',
        body: { totpCode },
      });
      setBackupCodes(data.backupCodes);

      // Re-fetch user so mfaEnabled = true propagates to store
      const updated = await getMe();
      setUser(updated);

      setSetupData(null);
      return true;
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Invalid code — try again');
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  // Disable MFA — requires current TOTP code
  async function disable(totpCode: string): Promise<boolean> {
    setIsLoading(true);
    setError('');
    try {
      await apiRequest('/auth/mfa/disable', {
        method: 'POST',
        body: { totpCode },
      });

      // Re-fetch user so mfaEnabled = false propagates to store
      const updated = await getMe();
      setUser(updated);

      return true;
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Invalid code — try again');
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  function resetSetup() {
    setSetupData(null);
    setBackupCodes(null);
    setError('');
  }

  return {
    mfaEnabled: user?.mfaEnabled ?? false,
    setupData,
    backupCodes,
    isLoading,
    error,
    startSetup,
    verifyAndEnable,
    disable,
    resetSetup,
  };
}

// ─── useSessions ──────────────────────────────────────────────────────────────

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [error, setError] = useState('');

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest<{ sessions: Session[] }>('/auth/sessions');
      setSessions(data.sessions);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  async function revokeSession(sessionId: string) {
    setRevokingId(sessionId);
    setError('');
    try {
      await apiRequest(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to revoke session');
    } finally {
      setRevokingId(null);
    }
  }

  async function revokeAllOther() {
    setIsRevokingAll(true);
    setError('');
    try {
      await apiRequest('/auth/sessions', { method: 'DELETE' });
      // Re-fetch so the list reflects only the current session
      await fetchSessions();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to revoke sessions');
    } finally {
      setIsRevokingAll(false);
    }
  }

  return {
    sessions,
    isLoading,
    revokingId,
    isRevokingAll,
    error,
    revokeSession,
    revokeAllOther,
    refetch: fetchSessions,
  };
}
