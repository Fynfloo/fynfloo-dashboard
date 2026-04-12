// features/discounts/hooks/useDiscounts.ts
'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { DiscountCode, CreateDiscountInput, UpdateDiscountInput } from '@/lib/types';

// ─── useDiscounts — list + create + delete ────────────────────────────────────

export function useDiscounts(storeId: string) {
  const [isPending, setIsPending] = useState(false);

  async function listDiscounts(): Promise<DiscountCode[]> {
    setIsPending(true);
    try {
      return await apiRequest<DiscountCode[]>(`/api/tenant/${storeId}/discounts`);
    } finally {
      setIsPending(false);
    }
  }

  async function createDiscount(input: CreateDiscountInput): Promise<DiscountCode> {
    setIsPending(true);
    try {
      return await apiRequest<DiscountCode>(`/api/tenant/${storeId}/discounts`, {
        method: 'POST',
        body: input,
      });
    } finally {
      setIsPending(false);
    }
  }

  async function deleteDiscount(discountId: string): Promise<void> {
    setIsPending(true);
    try {
      await apiRequest(`/api/tenant/${storeId}/discounts/${discountId}`, {
        method: 'DELETE',
      });
    } finally {
      setIsPending(false);
    }
  }

  return { listDiscounts, createDiscount, deleteDiscount, isPending };
}

// ─── useDiscount — single update ──────────────────────────────────────────────

export function useDiscount(storeId: string, discountId: string) {
  const [isPending, setIsPending] = useState(false);

  async function updateDiscount(input: UpdateDiscountInput): Promise<DiscountCode> {
    setIsPending(true);
    try {
      return await apiRequest<DiscountCode>(`/api/tenant/${storeId}/discounts/${discountId}`, {
        method: 'PATCH',
        body: input,
      });
    } finally {
      setIsPending(false);
    }
  }

  return { updateDiscount, isPending };
}
