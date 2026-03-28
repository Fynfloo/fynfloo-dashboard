// features/products/hooks/useCollections.ts
'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/api';

export type Collection = {
  id: string;
  handle: string;
  name: string;
  description: string | null;
  type: string;
  _count: { products: number };
};

export type CollectionSimple = {
  id: string;
  handle: string;
  name: string;
};

// ─── useCollections — all store collections ───────────────────────────────────

export function useCollections(storeId: string) {
  const [isPending, setIsPending] = useState(false);

  async function listCollections(): Promise<Collection[]> {
    setIsPending(true);
    try {
      const res = await apiRequest<{ collections: Collection[] }>(
        `/api/tenant/${storeId}/collections`,
      );
      return res.collections;
    } finally {
      setIsPending(false);
    }
  }

  return { listCollections, isPending };
}

// ─── useProductCollections — product membership ───────────────────────────────

export function useProductCollections(storeId: string, productId: string) {
  // Track in-flight toggle IDs to prevent double-tap race conditions
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  function isTogglePending(collectionId: string): boolean {
    return pendingIds.has(collectionId);
  }

  async function listProductCollections(): Promise<CollectionSimple[]> {
    const res = await apiRequest<{ collections: CollectionSimple[] }>(
      `/api/tenant/${storeId}/products/${productId}/collections`,
    );
    return res.collections;
  }

  async function addToCollection(collectionId: string): Promise<void> {
    setPendingIds((prev) => new Set(prev).add(collectionId));
    try {
      await apiRequest(`/api/tenant/${storeId}/products/${productId}/collections`, {
        method: 'POST',
        body: { collectionId },
      });
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(collectionId);
        return next;
      });
    }
  }

  async function removeFromCollection(collectionId: string): Promise<void> {
    setPendingIds((prev) => new Set(prev).add(collectionId));
    try {
      await apiRequest(`/api/tenant/${storeId}/products/${productId}/collections/${collectionId}`, {
        method: 'DELETE',
      });
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(collectionId);
        return next;
      });
    }
  }

  // isPending is true if ANY toggle is in flight — used for global disable
  const isPending = pendingIds.size > 0;

  return {
    listProductCollections,
    addToCollection,
    removeFromCollection,
    isTogglePending,
    isPending,
  };
}
