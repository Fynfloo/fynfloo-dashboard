'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, FileText, Globe, Plus, Save } from 'lucide-react';
import type { StorefrontPage } from '@/lib/types';
import { useStorefrontPages } from '../hooks/useStorefrontPages';

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

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      className="rounded-[var(--radius-lg)] p-5 space-y-4"
      style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
    >
      <div className="space-y-1">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
        {description && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 rounded-[var(--radius-md)] text-sm outline-none transition-colors"
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
      className="w-full px-3 py-2 rounded-[var(--radius-md)] text-sm outline-none transition-colors resize-y min-h-[96px]"
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

function pageLabel(page: StorefrontPage): string {
  return page.name?.trim() || page.path;
}

export function StorefrontPagesManager() {
  const params = useParams();
  const storeId = params.storeId as string;
  const {
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
  } = useStorefrontPages(storeId);

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [createName, setCreateName] = useState('');
  const [createPath, setCreatePath] = useState('');
  const [draft, setDraft] = useState<DraftFields>(EMPTY_DRAFT);
  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedPageId) ?? pages[0] ?? null,
    [pages, selectedPageId],
  );

  useEffect(() => {
    if (selectedPage && selectedPage.id !== selectedPageId) {
      setSelectedPageId(selectedPage.id);
    }
  }, [selectedPage, selectedPageId]);

  useEffect(() => {
    setDraft(toDraftFields(selectedPage));
  }, [selectedPage]);

  async function handleCreatePage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const page = await createPage({
      name: createName,
      path: createPath,
    });

    if (!page) return;

    setCreateName('');
    setCreatePath('');
    setSelectedPageId(page.id);
  }

  async function handleSaveDraft() {
    if (!selectedPage) return;

    const result = await saveDraft(selectedPage.id, {
      ...(selectedPage.pageClass === 'content' && !selectedPage.isPublished
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
    if (!selectedPage) return;
    const result = await publish(selectedPage.id);
    if (result) {
      setDraft(toDraftFields(result));
    }
  }

  async function handleDiscard() {
    if (!selectedPage) return;
    const result = await discard(selectedPage.id);
    if (!result) return;

    if (result.deleted) {
      setSelectedPageId(pages.find((page) => page.id !== selectedPage.id)?.id ?? null);
      setDraft(EMPTY_DRAFT);
      return;
    }

    setDraft(toDraftFields(result.page));
  }

  return (
    <Section
      title="Pages"
      description="Create custom storefront pages and manage their draft SEO state before the visual section editor lands."
    >
      <form onSubmit={handleCreatePage} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
        <TextInput
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
          placeholder="Page name"
          disabled={isCreating}
        />
        <TextInput
          value={createPath}
          onChange={(e) => setCreatePath(e.target.value)}
          placeholder="/about-us"
          disabled={isCreating}
        />
        <button
          type="submit"
          disabled={isCreating}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium"
          style={{
            background: 'var(--accent)',
            color: 'white',
            opacity: isCreating ? 0.7 : 1,
          }}
        >
          <Plus className="h-4 w-4" />
          {isCreating ? 'Creating…' : 'Create page'}
        </button>
      </form>

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

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div
          className="rounded-[var(--radius-md)]"
          style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-elevated)' }}
        >
          {isLoading ? (
            <div className="px-4 py-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Loading pages…
            </div>
          ) : pages.length === 0 ? (
            <div className="px-4 py-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
              No pages yet.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--bg-border-subtle)' }}>
              {pages.map((page) => {
                const isSelected = page.id === selectedPage?.id;

                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setSelectedPageId(page.id)}
                    className="w-full px-4 py-3 text-left transition-colors"
                    style={{
                      background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {pageLabel(page)}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {page.path}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            background:
                              page.pageClass === 'system'
                                ? 'rgba(148, 163, 184, 0.12)'
                                : 'rgba(59, 130, 246, 0.12)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {page.pageClass}
                        </span>
                        {!page.isPublished && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{
                              background: 'rgba(245, 158, 11, 0.12)',
                              color: 'rgb(180, 83, 9)',
                            }}
                          >
                            draft only
                          </span>
                        )}
                        {page.hasUnpublishedChanges && page.isPublished && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{
                              background: 'rgba(34, 197, 94, 0.12)',
                              color: 'rgb(21, 128, 61)',
                            }}
                          >
                            draft changes
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div
          className="rounded-[var(--radius-md)] p-5 space-y-5"
          style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-elevated)' }}
        >
          {!selectedPage ? (
            <div className="flex min-h-[240px] items-center justify-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Select a page to manage its draft state.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                    <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {pageLabel(selectedPage)}
                    </h3>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Draft page metadata is editable now. Visual section editing plugs into this same page state next.
                  </p>
                </div>
                {selectedPage.isPublished ? (
                  <a
                    href={selectedPage.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium"
                    style={{ color: 'var(--accent)' }}
                  >
                    <Globe className="h-4 w-4" />
                    Open page
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    <Globe className="h-4 w-4" />
                    Draft pages are hidden until published
                  </span>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Page name
                  </label>
                  <TextInput
                    value={draft.name}
                    disabled={selectedPage.pageClass !== 'content' || selectedPage.isPublished}
                    onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Page path
                  </label>
                  <TextInput
                    value={draft.path}
                    disabled={selectedPage.pageClass !== 'content' || selectedPage.isPublished}
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
                  onChange={(e) =>
                    setDraft((current) => ({ ...current, seoDescription: e.target.value }))
                  }
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
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    The page route and publish state are live now. Full drag-and-drop section editing is the next storefront editor step.
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium"
                  style={{ background: 'var(--accent)', color: 'white', opacity: isSaving ? 0.7 : 1 }}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving…' : 'Save draft'}
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium"
                  style={{
                    border: '1px solid var(--bg-border-subtle)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    opacity: isPublishing ? 0.7 : 1,
                  }}
                >
                  {isPublishing ? 'Publishing…' : selectedPage.isPublished ? 'Publish changes' : 'Publish page'}
                </button>
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={isDiscarding}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium"
                  style={{
                    border: '1px solid var(--bg-border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    opacity: isDiscarding ? 0.7 : 1,
                  }}
                >
                  {isDiscarding ? 'Discarding…' : selectedPage.isPublished ? 'Discard draft' : 'Delete draft page'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Section>
  );
}
