// features/products/hooks/useProducts.ts
'use client';

import { useState } from 'react';
import { apiRequest, getAccessToken } from '@/lib/api';
import type {
  Product,
  ProductListResponse,
  CreateProductInput,
  UpdateProductInput,
  UpdateInventoryInput,
  ProductStatus,
} from '@/lib/types';

// ─── useProducts — list + create + delete ─────────────────────────────────────

export function useProducts(storeId: string) {
  const [isPending, setIsPending] = useState(false);

  async function listProducts(
    opts: {
      page?: number;
      limit?: number;
      status?: ProductStatus;
    } = {},
  ): Promise<ProductListResponse> {
    setIsPending(true);
    try {
      const params = new URLSearchParams();
      // Use String() and explicit check — avoids falsy trap on page=0
      if (opts.page !== undefined) params.set('page', String(opts.page));
      if (opts.limit !== undefined) params.set('limit', String(opts.limit));
      if (opts.status) params.set('status', opts.status);
      const qs = params.toString();
      return await apiRequest<ProductListResponse>(
        `/api/tenant/${storeId}/products${qs ? `?${qs}` : ''}`,
      );
    } finally {
      setIsPending(false);
    }
  }

  async function createProduct(input: CreateProductInput): Promise<Product> {
    setIsPending(true);
    try {
      return await apiRequest<Product>(`/api/tenant/${storeId}/products`, {
        method: 'POST',
        body: input,
      });
    } finally {
      setIsPending(false);
    }
  }

  async function deleteProduct(productId: string): Promise<void> {
    setIsPending(true);
    try {
      await apiRequest(`/api/tenant/${storeId}/products/${productId}`, {
        method: 'DELETE',
      });
    } finally {
      setIsPending(false);
    }
  }

  return { listProducts, createProduct, deleteProduct, isPending };
}

// ─── useProduct — single get + update ────────────────────────────────────────

export function useProduct(storeId: string, productId: string) {
  const [isPending, setIsPending] = useState(false);

  async function getProduct(): Promise<Product> {
    setIsPending(true);
    try {
      return await apiRequest<Product>(`/api/tenant/${storeId}/products/${productId}`);
    } finally {
      setIsPending(false);
    }
  }

  async function updateProduct(input: UpdateProductInput): Promise<Product> {
    setIsPending(true);
    try {
      return await apiRequest<Product>(`/api/tenant/${storeId}/products/${productId}`, {
        method: 'PATCH',
        body: input,
      });
    } finally {
      setIsPending(false);
    }
  }

  return { getProduct, updateProduct, isPending };
}

// ─── useProductImages ─────────────────────────────────────────────────────────

export function useProductImages(storeId: string, productId: string) {
  const [isPending, setIsPending] = useState(false);

  async function uploadImage(file: File) {
    if (!productId) throw new Error('Product must be saved before uploading images');
    setIsPending(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // getAccessToken is a static import — no dynamic import needed
      const token = getAccessToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tenant/${storeId}/products/${productId}/images`,
        {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            Accept: 'application/json',
          },
          credentials: 'include',
          body: formData,
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw { status: res.status, message: err.error ?? 'Upload failed' };
      }

      return res.json();
    } finally {
      setIsPending(false);
    }
  }

  async function deleteImage(imageId: string) {
    setIsPending(true);
    try {
      await apiRequest(`/api/tenant/${storeId}/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
      });
    } finally {
      setIsPending(false);
    }
  }

  async function reorderImages(images: { id: string; position: number }[]) {
    setIsPending(true);
    try {
      await apiRequest(`/api/tenant/${storeId}/products/${productId}/images/reorder`, {
        method: 'PATCH',
        body: { images },
      });
    } finally {
      setIsPending(false);
    }
  }

  return { uploadImage, deleteImage, reorderImages, isPending };
}

// ─── useInventory ─────────────────────────────────────────────────────────────

export function useInventory(storeId: string, productId: string) {
  const [isPending, setIsPending] = useState(false);

  async function updateInventory(input: UpdateInventoryInput) {
    setIsPending(true);
    try {
      return await apiRequest(`/api/tenant/${storeId}/products/${productId}/inventory`, {
        method: 'PATCH',
        body: input,
      });
    } finally {
      setIsPending(false);
    }
  }

  return { updateInventory, isPending };
}
