// features/auth/hooks/useResetPassword.ts
import { useState } from 'react';
import { apiRequest } from '@/lib/api';

export function useResetPassword() {
  const [isPending, setIsPending] = useState(false);

  async function resetPassword(data: {
    token: string;
    uid: string;
    newPassword: string;
  }): Promise<void> {
    setIsPending(true);
    try {
      await apiRequest<{ ok: boolean }>('/auth/reset-password', {
        method: 'POST',
        body: data,
        skipRefresh: true,
      });
    } finally {
      setIsPending(false);
    }
  }

  return { resetPassword, isPending };
}
