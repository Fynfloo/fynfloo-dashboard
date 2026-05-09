'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type {
  CreateStorefrontPageInput,
  DiscardStorefrontPageDraftResult,
  StorefrontPage,
  StorefrontPagesResponse,
  UpdateStorefrontPageDraftInput,
} from '@/lib/types';

function formatStorefrontPagesError(err: unknown, fallback: string): string {
  const e = err as { message?: string; status?: number };
  const message = e?.message ?? fallback;

  if (
    message === 'Internal server error' ||
    (typeof e?.status === 'number' && e.status >= 500)
  ) {
    return `${message}. If you just pulled the latest storefront changes, restart the API and apply the newest Prisma migration.`;
  }

  return message;
}

async function getStorefrontPages(tenantId: string): Promise<StorefrontPagesResponse> {
  return apiRequest<StorefrontPagesResponse>(`/api/tenant/${tenantId}/settings/storefront/pages`);
}

async function createStorefrontPage(
  tenantId: string,
  input: CreateStorefrontPageInput,
): Promise<StorefrontPage> {
  return apiRequest<StorefrontPage>(`/api/tenant/${tenantId}/settings/storefront/pages`, {
    method: 'POST',
    body: input,
  });
}

async function updateStorefrontPageDraft(
  tenantId: string,
  pageId: string,
  input: UpdateStorefrontPageDraftInput,
): Promise<StorefrontPage> {
  return apiRequest<StorefrontPage>(
    `/api/tenant/${tenantId}/settings/storefront/pages/${pageId}/draft`,
    {
      method: 'PATCH',
      body: input,
    },
  );
}

async function publishStorefrontPage(tenantId: string, pageId: string): Promise<StorefrontPage> {
  return apiRequest<StorefrontPage>(
    `/api/tenant/${tenantId}/settings/storefront/pages/${pageId}/publish`,
    {
      method: 'POST',
    },
  );
}

async function discardStorefrontPageDraft(
  tenantId: string,
  pageId: string,
): Promise<DiscardStorefrontPageDraftResult> {
  return apiRequest<DiscardStorefrontPageDraftResult>(
    `/api/tenant/${tenantId}/settings/storefront/pages/${pageId}/discard`,
    {
      method: 'POST',
    },
  );
}

function upsertPage(pages: StorefrontPage[], page: StorefrontPage): StorefrontPage[] {
  const existingIndex = pages.findIndex((entry) => entry.id === page.id);

  if (existingIndex === -1) {
    return [...pages, page];
  }

  return pages.map((entry) => (entry.id === page.id ? page : entry));
}

export function useStorefrontPages(tenantId: string) {
  const [pages, setPages] = useState<StorefrontPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    if (!tenantId) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await getStorefrontPages(tenantId);
      setPages(result.pages);
    } catch (err) {
      setError(formatStorefrontPagesError(err, 'Failed to load storefront pages'));
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  async function createPage(input: CreateStorefrontPageInput): Promise<StorefrontPage | null> {
    setIsCreating(true);
    setError(null);
    try {
      const page = await createStorefrontPage(tenantId, input);
      setPages((current) => upsertPage(current, page));
      return page;
    } catch (err) {
      setError(formatStorefrontPagesError(err, 'Failed to create storefront page'));
      return null;
    } finally {
      setIsCreating(false);
    }
  }

  async function saveDraft(
    pageId: string,
    input: UpdateStorefrontPageDraftInput,
  ): Promise<StorefrontPage | null> {
    setIsSaving(true);
    setError(null);
    try {
      const page = await updateStorefrontPageDraft(tenantId, pageId, input);
      setPages((current) => upsertPage(current, page));
      return page;
    } catch (err) {
      setError(formatStorefrontPagesError(err, 'Failed to save page draft'));
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function publish(pageId: string): Promise<StorefrontPage | null> {
    setIsPublishing(true);
    setError(null);
    try {
      const page = await publishStorefrontPage(tenantId, pageId);
      setPages((current) => upsertPage(current, page));
      return page;
    } catch (err) {
      setError(formatStorefrontPagesError(err, 'Failed to publish page changes'));
      return null;
    } finally {
      setIsPublishing(false);
    }
  }

  async function discard(pageId: string): Promise<DiscardStorefrontPageDraftResult | null> {
    setIsDiscarding(true);
    setError(null);
    try {
      const result = await discardStorefrontPageDraft(tenantId, pageId);
      setPages((current) =>
        result.deleted
          ? current.filter((page) => page.id !== result.pageId)
          : upsertPage(current, result.page),
      );
      return result;
    } catch (err) {
      setError(formatStorefrontPagesError(err, 'Failed to discard page draft'));
      return null;
    } finally {
      setIsDiscarding(false);
    }
  }

  return {
    pages,
    isLoading,
    isCreating,
    isSaving,
    isPublishing,
    isDiscarding,
    error,
    createPage,
    saveDraft,
    publish,
    discard,
    refetch: fetchPages,
  };
}
