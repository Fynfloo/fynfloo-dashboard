// features/customers/hooks/useCustomers.ts
'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { CustomerListResponse } from '@/lib/types';

export function useCustomers(storeId: string) {
  const [isPending, setIsPending] = useState(false);

  async function fetchCustomers(page = 1, limit = 20): Promise<CustomerListResponse> {
    setIsPending(true);
    try {
      return await apiRequest<CustomerListResponse>(
        `/api/tenant/${storeId}/customers?page=${page}&limit=${limit}`,
      );
    } finally {
      setIsPending(false);
    }
  }

  return { fetchCustomers, isPending };
}
