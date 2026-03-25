// features/auth/hooks/useForgotPassword.ts
import { useState } from 'react';
import { apiRequest } from '@/lib/api';

export function useForgotPassword() {
  const [isPending, setIsPending] = useState(false);

  async function forgotPassword(email: string): Promise<void> {
    setIsPending(true);
    try {
      await apiRequest<{ ok: boolean }>('/auth/forgot-password', {
        method: 'POST',
        body: { email },
        skipRefresh: true,
      });
    } finally {
      setIsPending(false);
    }
  }

  return { forgotPassword, isPending };
}
