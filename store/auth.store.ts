// store/auth.store.ts
import { create } from 'zustand';
import type { MeResponse, Store } from '@/lib/types';

type AuthState = {
  user: MeResponse | null;
  stores: Store[];
  isLoading: boolean;
  isInitialised: boolean;

  setUser: (user: MeResponse) => void;
  setStores: (stores: Store[]) => void;
  setLoading: (loading: boolean) => void;
  setInitialised: (initialised: boolean) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  stores: [],
  isLoading: true,
  isInitialised: false,

  setUser: (user) => set({ user }),
  setStores: (stores) => set({ stores }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialised: (isInitialised) => set({ isInitialised }),
  reset: () =>
    set({
      user: null,
      stores: [],
      isLoading: false,
      isInitialised: true,
    }),
}));
