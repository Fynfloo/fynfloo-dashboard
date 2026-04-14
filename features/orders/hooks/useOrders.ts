// features/orders/hooks/useOrders.ts
'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { OrderListResponse, OrderDetail, OrderSummary, FulfilOrderInput } from '@/lib/types';

// ─── useOrders — list + summary ───────────────────────────────────────────────

export function useOrders(storeId: string) {
  const [isPending, setIsPending] = useState(false);

  async function listOrders(
    opts: {
      status?: 'all' | 'unfulfilled' | 'fulfilled' | 'pending';
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<OrderListResponse> {
    setIsPending(true);
    try {
      const params = new URLSearchParams();
      if (opts.status) params.set('status', opts.status);
      if (opts.search) params.set('search', opts.search);
      if (opts.page !== undefined) params.set('page', String(opts.page));
      if (opts.limit !== undefined) params.set('limit', String(opts.limit));
      const qs = params.toString();
      return await apiRequest<OrderListResponse>(
        `/api/tenant/${storeId}/orders${qs ? `?${qs}` : ''}`,
      );
    } finally {
      setIsPending(false);
    }
  }

  async function getOrderSummary(): Promise<OrderSummary> {
    return apiRequest<OrderSummary>(`/api/tenant/${storeId}/orders/summary`);
  }

  return { listOrders, getOrderSummary, isPending };
}

// ─── useOrder — single order detail + actions ─────────────────────────────────

export function useOrder(storeId: string, orderId: string) {
  const [isPending, setIsPending] = useState(false);

  async function getOrder(): Promise<OrderDetail> {
    setIsPending(true);
    try {
      return await apiRequest<OrderDetail>(`/api/tenant/${storeId}/orders/${orderId}`);
    } finally {
      setIsPending(false);
    }
  }

  async function fulfilOrder(input: FulfilOrderInput): Promise<{ ok: true }> {
    setIsPending(true);
    try {
      return await apiRequest<{ ok: true }>(`/api/tenant/${storeId}/orders/${orderId}/fulfil`, {
        method: 'PATCH',
        body: input,
      });
    } finally {
      setIsPending(false);
    }
  }

  async function addNote(note: string): Promise<{ ok: true }> {
    setIsPending(true);
    try {
      return await apiRequest<{ ok: true }>(`/api/tenant/${storeId}/orders/${orderId}/notes`, {
        method: 'POST',
        body: { note },
      });
    } finally {
      setIsPending(false);
    }
  }

  function getPackingSlipUrl(): string {
    return `${process.env.NEXT_PUBLIC_API_URL}/api/tenant/${storeId}/orders/${orderId}/packing-slip`;
  }

  return { getOrder, fulfilOrder, addNote, getPackingSlipUrl, isPending };
}
