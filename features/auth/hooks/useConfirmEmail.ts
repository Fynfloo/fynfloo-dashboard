// features/auth/hooks/useConfirmEmail.ts
import { useState } from 'react';
import { apiRequest } from '@/lib/api';

type ConfirmEmailResult = {
  ok: boolean;
  message: string;
};

type Status = 'idle' | 'loading' | 'success' | 'error';

export function useConfirmEmail() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  async function confirmEmail(token: string, uid: string): Promise<void> {
    setStatus('loading');
    try {
      await apiRequest<ConfirmEmailResult>(`/auth/confirm-email?token=${token}&uid=${uid}`, {
        skipRefresh: true,
      });
      setStatus('success');
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      setErrorMessage(e?.message ?? 'This link is invalid or has expired');
      setStatus('error');
    }
  }

  return { confirmEmail, status };
}
