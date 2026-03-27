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
  const [isPending, setIsPending] = useState(false);

  async function listProductCollections(): Promise<CollectionSimple[]> {
    setIsPending(true);
    try {
      const res = await apiRequest<{ collections: CollectionSimple[] }>(
        `/api/tenant/${storeId}/products/${productId}/collections`,
      );
      return res.collections;
    } finally {
      setIsPending(false);
    }
  }

  async function addToCollection(collectionId: string): Promise<void> {
    setIsPending(true);
    try {
      await apiRequest(`/api/tenant/${storeId}/products/${productId}/collections`, {
        method: 'POST',
        body: { collectionId },
      });
    } finally {
      setIsPending(false);
    }
  }

  async function removeFromCollection(collectionId: string): Promise<void> {
    setIsPending(true);
    try {
      await apiRequest(`/api/tenant/${storeId}/products/${productId}/collections/${collectionId}`, {
        method: 'DELETE',
      });
    } finally {
      setIsPending(false);
    }
  }

  return { listProductCollections, addToCollection, removeFromCollection, isPending };
}
