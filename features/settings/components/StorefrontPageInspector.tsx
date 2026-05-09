'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FileText, Globe, Save } from 'lucide-react';
import type { StorefrontPage, UpdateStorefrontPageDraftInput } from '@/lib/types';
import { getStorefrontPageLabel } from '../lib/storefrontEditor';

type DraftFields = {
  name: string;
  path: string;
  seoTitle: string;
  seoDescription: string;
};

const EMPTY_DRAFT: DraftFields = {
  name: '',
  path: '',
  seoTitle: '',
  seoDescription: '',
};

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-[var(--radius-md)] px-3 py-2 text-sm outline-none transition-colors"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-border-subtle)',
        color: 'var(--text-primary)',
      }}
    />
  );
}

function TextareaInput(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-[96px] w-full resize-y rounded-[var(--radius-md)] px-3 py-2 text-sm outline-none transition-colors"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-border-subtle)',
        color: 'var(--text-primary)',
      }}
    />
  );
}

function toDraftFields(page: StorefrontPage | null): DraftFields {
  if (!page) return EMPTY_DRAFT;

  return {
    name: page.name ?? '',
    path: page.path,
    seoTitle: page.draft.seoTitle ?? '',
    seoDescription: page.draft.seoDescription ?? '',
  };
}

function serializeDraft(values: DraftFields): string {
  return JSON.stringify(values);
}

type StorefrontPageInspectorProps = {
  page: StorefrontPage | null;
  isLoading: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  isDiscarding: boolean;
  error: string | null;
  saveDraft: (
    pageId: string,
    input: UpdateStorefrontPageDraftInput,
  ) => Promise<StorefrontPage | null>;
  publish: (pageId: string) => Promise<StorefrontPage | null>;
  discard: (pageId: string) => Promise<{ deleted: false; page: StorefrontPage } | { deleted: true; pageId: string } | null>;
};

export function StorefrontPageInspector({
  page,
  isLoading,
  isSaving,
  isPublishing,
  isDiscarding,
  error,
  saveDraft,
  publish,
  discard,
}: StorefrontPageInspectorProps) {
  const [draft, setDraft] = useState<DraftFields>(EMPTY_DRAFT);

  useEffect(() => {
    setDraft(toDraftFields(page));
  }, [page]);

  const baseDraft = useMemo(() => toDraftFields(page), [page]);
  const hasUnsavedChanges = serializeDraft(draft) !== serializeDraft(baseDraft);

  async function handleSaveDraft() {
    if (!page) return;

    const result = await saveDraft(page.id, {
      ...(page.pageClass === 'content' && !page.isPublished
        ? {
            name: draft.name,
            path: draft.path,
          }
        : {}),
      seoTitle: draft.seoTitle || null,
      seoDescription: draft.seoDescription || null,
    });

    if (result) {
      setDraft(toDraftFields(result));
    }
  }

  async function handlePublish() {
    if (!page) return;
    const result = await publish(page.id);
    if (result) {
      setDraft(toDraftFields(result));
    }
  }

  async function handleDiscard() {
    if (!page) return;
    const result = await discard(page.id);
    if (!result || result.deleted) return;
    setDraft(toDraftFields(result.page));
  }

  if (isLoading) {
    return (
      <div
        className="rounded-[var(--radius-lg)] p-5"
        style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
      >
        <div className="h-48 animate-pulse rounded-[var(--radius-md)]" style={{ background: 'var(--bg-elevated)' }} />
      </div>
    );
  }

  if (!page) {
    return (
      <div
        className="flex min-h-[320px] items-center justify-center rounded-[var(--radius-lg)] p-5 text-sm"
        style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
      >
        Select a page from the site tree to edit its draft settings.
      </div>
    );
  }

  return (
    <div
      className="rounded-[var(--radius-lg)] p-5 space-y-5"
      style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                {getStorefrontPageLabel(page)}
              </h2>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Page routing and draft metadata live here now so the visual section editor can plug into the same page record next.
            </p>
          </div>
          {page.isPublished ? (
            <a
              href={page.path}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              <Globe className="h-4 w-4" />
              Open live page
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              <Globe className="h-4 w-4" />
              Draft-only pages stay hidden until published
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              background:
                page.pageClass === 'system'
                  ? 'rgba(148, 163, 184, 0.12)'
                  : page.pageClass === 'capability'
                    ? 'rgba(168, 85, 247, 0.12)'
                    : 'rgba(59, 130, 246, 0.12)',
              color: 'var(--text-secondary)',
            }}
          >
            {page.pageClass}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            {page.kind}
          </span>
          {!page.isPublished && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'rgb(180, 83, 9)' }}
            >
              draft only
            </span>
          )}
          {page.hasUnpublishedChanges && page.isPublished && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: 'rgba(34, 197, 94, 0.12)', color: 'rgb(21, 128, 61)' }}
            >
              draft changes
            </span>
          )}
          {hasUnsavedChanges && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
            >
              local edits not saved
            </span>
          )}
        </div>
      </div>

      {error && (
        <div
          className="flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm"
          style={{
            borderColor: 'rgba(239, 68, 68, 0.25)',
            background: 'rgba(239, 68, 68, 0.08)',
            color: 'var(--text-primary)',
          }}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Page name
          </label>
          <TextInput
            value={draft.name}
            disabled={page.pageClass !== 'content' || page.isPublished}
            onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Page path
          </label>
          <TextInput
            value={draft.path}
            disabled={page.pageClass !== 'content' || page.isPublished}
            onChange={(e) => setDraft((current) => ({ ...current, path: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          SEO title
        </label>
        <TextInput
          value={draft.seoTitle}
          onChange={(e) => setDraft((current) => ({ ...current, seoTitle: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          SEO description
        </label>
        <TextareaInput
          value={draft.seoDescription}
          onChange={(e) => setDraft((current) => ({ ...current, seoDescription: e.target.value }))}
        />
      </div>

      <div
        className="rounded-[var(--radius-md)] border px-4 py-3 text-sm"
        style={{
          borderColor: 'var(--bg-border-subtle)',
          background: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
        }}
      >
        Visual section drag-and-drop lands on top of this same page record, so page selection and editing now live beside the preview instead of in a separate manager.
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSaveDraft()}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium"
          style={{ background: 'var(--accent)', color: 'white', opacity: isSaving ? 0.7 : 1 }}
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={isPublishing || hasUnsavedChanges}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium"
          style={{
            border: '1px solid var(--bg-border-subtle)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            opacity: isPublishing || hasUnsavedChanges ? 0.7 : 1,
          }}
        >
          {isPublishing ? 'Publishing…' : page.isPublished ? 'Publish changes' : 'Publish page'}
        </button>
        <button
          type="button"
          onClick={() => void handleDiscard()}
          disabled={isDiscarding}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium"
          style={{
            border: '1px solid var(--bg-border-subtle)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            opacity: isDiscarding ? 0.7 : 1,
          }}
        >
          {isDiscarding ? 'Discarding…' : page.isPublished ? 'Discard draft' : 'Delete draft page'}
        </button>
      </div>
    </div>
  );
}
