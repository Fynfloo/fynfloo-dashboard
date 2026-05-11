'use client';

import { useEffect, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Globe, RefreshCw, Save } from 'lucide-react';
import type { StorefrontPage, UpdateStorefrontPageDraftInput } from '@/lib/types';
import { getStorefrontPageLabel } from '../lib/storefrontEditor';
import {
  useSiteEditorDraftSession,
  type SiteEditorSaveState,
} from '@/features/site-editor/lib/useSiteEditorDraftSession';

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
  isPublishing: boolean;
  isDiscarding: boolean;
  error: string | null;
  saveDraft: (
    pageId: string,
    input: UpdateStorefrontPageDraftInput,
  ) => Promise<StorefrontPage | null>;
  publish: (pageId: string) => Promise<StorefrontPage | null>;
  discard: (pageId: string) => Promise<{ deleted: false; page: StorefrontPage } | { deleted: true; pageId: string } | null>;
  onDirtyChange?: (hasUnsavedChanges: boolean) => void;
  onSaveStateChange?: (state: SiteEditorSaveState) => void;
};

export function StorefrontPageInspector({
  page,
  isLoading,
  isPublishing,
  isDiscarding,
  error,
  saveDraft,
  publish,
  discard,
  onDirtyChange,
  onSaveStateChange,
}: StorefrontPageInspectorProps) {
  const baseDraft = useMemo(() => toDraftFields(page), [page]);
  const {
    draft,
    setDraft,
    saveState,
    hasPendingChanges,
    saveNow,
    replacePersisted,
  } = useSiteEditorDraftSession({
    resetKey: page?.id ?? 'page:empty',
    initialValue: baseDraft,
    serialize: serializeDraft,
    autosaveMs: 800,
    save: async (nextDraft) => {
      if (!page) {
        return { ok: false };
      }

      const result = await saveDraft(page.id, {
        ...(page.pageClass === 'content' && !page.isPublished
          ? {
              name: nextDraft.name,
              path: nextDraft.path,
            }
          : {}),
        seoTitle: nextDraft.seoTitle || null,
        seoDescription: nextDraft.seoDescription || null,
      });

      return result
        ? { ok: true, persisted: toDraftFields(result) }
        : { ok: false };
    },
  });

  useEffect(() => {
    onDirtyChange?.(hasPendingChanges);
    return () => onDirtyChange?.(false);
  }, [hasPendingChanges, onDirtyChange]);

  useEffect(() => {
    onSaveStateChange?.(saveState);
    return () => onSaveStateChange?.('idle');
  }, [onSaveStateChange, saveState]);

  async function handlePublish() {
    if (!page) return;
    const result = await publish(page.id);
    if (result) {
      replacePersisted(toDraftFields(result));
    }
  }

  async function handleDiscard() {
    if (!page) return;
    const result = await discard(page.id);
    if (!result) return;
    if (result.deleted) {
      replacePersisted(EMPTY_DRAFT);
      return;
    }

    replacePersisted(toDraftFields(result.page));
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
              Update page details, search snippets, and publishing status here.
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
          {saveState === 'saving' && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
            >
              <RefreshCw className="mr-1 inline h-3 w-3" />
              Saving…
            </span>
          )}
          {saveState === 'saved' && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: 'var(--green-bg)', color: 'var(--green)' }}
            >
              <CheckCircle2 className="mr-1 inline h-3 w-3" />
              Saved
            </span>
          )}
          {saveState === 'dirty' && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
            >
              Unsaved edits
            </span>
          )}
          {saveState === 'error' && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: 'rgba(239, 68, 68, 0.08)', color: 'rgb(153, 27, 27)' }}
            >
              Save failed
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
        Update page details here.
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void saveNow()}
          disabled={saveState === 'saving'}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium"
          style={{
            background: 'var(--accent)',
            color: 'white',
            opacity: saveState === 'saving' ? 0.7 : 1,
          }}
        >
          <Save className="h-4 w-4" />
          {saveState === 'saving'
            ? 'Saving…'
            : saveState === 'saved'
              ? 'Saved'
              : saveState === 'error'
                ? 'Retry save'
                : 'Save now'}
        </button>
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={isPublishing || hasPendingChanges}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium"
          style={{
            border: '1px solid var(--bg-border-subtle)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            opacity: isPublishing || hasPendingChanges ? 0.7 : 1,
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
