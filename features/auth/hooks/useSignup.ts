// features/auth/hooks/useSignup.ts
import { useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { SignupResponse } from '@/lib/types';

type SignupInput = {
  name: string;
  email: string;
  password: string;
};

export function useSignup() {
  const [isPending, setIsPending] = useState(false);

  async function signup(input: SignupInput): Promise<SignupResponse> {
    setIsPending(true);
    try {
      return await apiRequest<SignupResponse>('/auth/signup', {
        method: 'POST',
        body: input,
        skipRefresh: true,
      });
    } finally {
      setIsPending(false);
    }
  }

  return { signup, isPending };
}
