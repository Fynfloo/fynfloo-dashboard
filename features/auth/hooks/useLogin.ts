// features/auth/hooks/useLogin.ts
import { setAccessToken, apiRequest } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { useAuthStore } from '@/store/auth.store';
import type {
  LoginResponse,
  MfaVerifyResponse,
  StoresResponse,
  MeResponse,
  Store,
} from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type LoginInput = {
  email: string;
  password: string;
};

type LoginResult = { requiresMfa: false } | { requiresMfa: true; mfaToken: string };

type MfaInput = {
  mfaToken: string;
  totpCode: string;
};

// ─── Shared hydration ─────────────────────────────────────────────────────────

async function hydrateUser(
  setUser: (user: MeResponse) => void,
  setStores: (stores: Store[]) => void,
  setLoading: (loading: boolean) => void,
): Promise<void> {
  setLoading(true);
  try {
    const [user, { stores }] = await Promise.all([
      getMe(),
      apiRequest<StoresResponse>('/api/stores'),
    ]);
    setUser(user);
    setStores(stores);
  } finally {
    setLoading(false);
  }
}

// ─── useLogin ─────────────────────────────────────────────────────────────────

export function useLogin() {
  const { setUser, setStores, setLoading } = useAuthStore();
  let isPending = false;

  async function login(input: LoginInput): Promise<LoginResult> {
    isPending = true;
    try {
      const res = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: input,
        skipRefresh: true,
      });

      if ('requiresMfa' in res && res.requiresMfa) {
        return { requiresMfa: true, mfaToken: res.mfaToken };
      }

      if ('accessToken' in res) {
        setAccessToken(res.accessToken);
        await hydrateUser(setUser, setStores, setLoading);
      }

      return { requiresMfa: false };
    } finally {
      isPending = false;
    }
  }

  return { login, isPending };
}

// ─── useMfaVerify ─────────────────────────────────────────────────────────────

export function useMfaVerify() {
  const { setUser, setStores, setLoading } = useAuthStore();
  let isPending = false;

  async function verifyMfa(input: MfaInput): Promise<void> {
    isPending = true;
    try {
      const res = await apiRequest<MfaVerifyResponse>('/auth/mfa/verify', {
        method: 'POST',
        body: input,
        skipRefresh: true,
      });
      setAccessToken(res.accessToken);
      await hydrateUser(setUser, setStores, setLoading);
    } finally {
      isPending = false;
    }
  }

  return { verifyMfa, isPending };
}
