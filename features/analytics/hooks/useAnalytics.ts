// features/analytics/hooks/useAnalytics.ts
'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/api';
import type {
  AnalyticsOverview,
  AnalyticsRevenue,
  AnalyticsTopProducts,
  AnalyticsPeriod,
} from '@/lib/types';

export function useAnalytics(storeId: string) {
  const [isPending, setIsPending] = useState(false);

  async function fetchOverview(period: AnalyticsPeriod): Promise<AnalyticsOverview> {
    setIsPending(true);
    try {
      return await apiRequest<AnalyticsOverview>(
        `/api/tenant/${storeId}/analytics/overview?period=${period}`,
      );
    } finally {
      setIsPending(false);
    }
  }

  async function fetchRevenue(period: AnalyticsPeriod): Promise<AnalyticsRevenue> {
    setIsPending(true);
    try {
      return await apiRequest<AnalyticsRevenue>(
        `/api/tenant/${storeId}/analytics/revenue?period=${period}`,
      );
    } finally {
      setIsPending(false);
    }
  }

  async function fetchTopProducts(period: AnalyticsPeriod): Promise<AnalyticsTopProducts> {
    setIsPending(true);
    try {
      return await apiRequest<AnalyticsTopProducts>(
        `/api/tenant/${storeId}/analytics/top-products?period=${period}`,
      );
    } finally {
      setIsPending(false);
    }
  }

  return { fetchOverview, fetchRevenue, fetchTopProducts, isPending };
}
