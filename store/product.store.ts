// store/product.store.ts
import { create } from 'zustand';

type ProductStoreState = {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
};

export const useProductStore = create<ProductStoreState>((set) => ({
  isDirty: false,
  setDirty: (dirty) => set({ isDirty: dirty }),
}));
