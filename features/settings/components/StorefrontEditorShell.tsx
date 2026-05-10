'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle, ExternalLink, FilePlus2, FolderTree, Globe, Layers3 } from 'lucide-react';
import { useCurrentStore } from '@/hooks/useStore';
import { StorefrontPageInspector } from './StorefrontPageInspector';
import { StorefrontRegionInspector } from './StorefrontRegionInspector';
import { useStorefrontPages } from '../hooks/useStorefrontPages';
import { useStorefrontRegions } from '../hooks/useStorefrontRegions';
import {
  buildStorefrontEditorGroups,
  buildStorefrontPreviewUrl,
  getDefaultStorefrontEditorSelection,
  resolveStorefrontPreviewState,
  type StorefrontEditorSelection,
} from '../lib/storefrontEditor';

const CONFIGURED_PREVIEW_ORIGIN = process.env.NEXT_PUBLIC_STOREFRONT_EDITOR_ORIGIN;

function subscribeToLocationOrigin(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  window.addEventListener('popstate', onStoreChange);
  return () => window.removeEventListener('popstate', onStoreChange);
}

function getLocationOriginSnapshot(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.location.origin;
}

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

export function StorefrontEditorShell() {
  const params = useParams();
  const storeId = params.storeId as string;
  const currentStore = useCurrentStore();
  const regionState = useStorefrontRegions(storeId);
  const pageState = useStorefrontPages(storeId);

  const [selection, setSelection] = useState<StorefrontEditorSelection | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPath, setCreatePath] = useState('');
  const currentOrigin = useSyncExternalStore(
    subscribeToLocationOrigin,
    getLocationOriginSnapshot,
    () => null,
  );

  const groups = useMemo(() => buildStorefrontEditorGroups(pageState.pages), [pageState.pages]);
  const effectiveSelection = useMemo(() => {
    if (!selection) {
      return getDefaultStorefrontEditorSelection(pageState.pages);
    }

    if (
      selection.type === 'page' &&
      !pageState.pages.some((page) => page.id === selection.pageId)
    ) {
      return getDefaultStorefrontEditorSelection(pageState.pages);
    }

    return selection;
  }, [pageState.pages, selection]);

  const selectedPage = useMemo(
    () =>
      effectiveSelection.type === 'page'
        ? pageState.pages.find((page) => page.id === effectiveSelection.pageId) ?? null
        : null,
    [effectiveSelection, pageState.pages],
  );

  const previewState = useMemo(
    () => resolveStorefrontPreviewState(effectiveSelection, pageState.pages),
    [effectiveSelection, pageState.pages],
  );

  const previewUrl = useMemo(
    () =>
      buildStorefrontPreviewUrl({
        subdomain: currentStore?.subdomain ?? null,
        path: previewState.path,
        currentOrigin,
        configuredOrigin: CONFIGURED_PREVIEW_ORIGIN,
      }),
    [currentOrigin, currentStore?.subdomain, previewState.path],
  );

  async function handleCreatePage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const page = await pageState.createPage({
      name: createName,
      path: createPath,
    });

    if (!page) return;

    setCreateName('');
    setCreatePath('');
    setIsCreatingPage(false);
    setSelection({ type: 'page', pageId: page.id });
  }

  function renderInspector() {
    if (effectiveSelection.type === 'region') {
      return (
        <StorefrontRegionInspector
          regionKey={effectiveSelection.regionKey}
          regions={regionState.regions}
          isLoading={regionState.isLoading}
          isSaving={regionState.isSaving}
          isPublishing={regionState.isPublishing}
          isDiscarding={regionState.isDiscarding}
          error={regionState.error}
          saveDraft={regionState.saveDraft}
          publish={regionState.publish}
          discard={regionState.discard}
        />
      );
    }

    return (
      <StorefrontPageInspector
        page={selectedPage}
        isLoading={pageState.isLoading}
        isSaving={pageState.isSaving}
        isPublishing={pageState.isPublishing}
        isDiscarding={pageState.isDiscarding}
        error={pageState.error}
        saveDraft={pageState.saveDraft}
        publish={pageState.publish}
        discard={pageState.discard}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div
        className="rounded-[var(--radius-lg)] p-5"
        style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4" style={{ color: 'var(--accent)' }} />
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Site Editor
              </h2>
            </div>
            <p className="max-w-3xl text-sm" style={{ color: 'var(--text-secondary)' }}>
              Site structure and page changes now live in one workspace so merchants can move through their store naturally. Deeper section controls build on top of this next.
            </p>
          </div>
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <FolderTree className="h-4 w-4" />
            Global regions and pages stay in one workspace now.
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_380px]">
        <aside
          className="rounded-[var(--radius-lg)] p-4 space-y-4"
          style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
        >
          <div className="space-y-1">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Site Tree
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Pick a shell region or page to edit it beside the preview.
            </p>
          </div>

          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div
                      className="text-xs font-semibold uppercase tracking-[0.08em]"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {group.label}
                    </div>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {group.description}
                    </p>
                  </div>
                  {group.id === 'content' && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingPage((current) => !current)}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                    >
                      <FilePlus2 className="h-3.5 w-3.5" />
                      New page
                    </button>
                  )}
                </div>

                {group.id === 'content' && isCreatingPage && (
                  <form
                    onSubmit={handleCreatePage}
                    className="rounded-[var(--radius-md)] p-3 space-y-3"
                    style={{
                      border: '1px solid var(--bg-border-subtle)',
                      background: 'var(--bg-elevated)',
                    }}
                  >
                    <TextInput
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="Page name"
                      disabled={pageState.isCreating}
                    />
                    <TextInput
                      value={createPath}
                      onChange={(e) => setCreatePath(e.target.value)}
                      placeholder="/about-us"
                      disabled={pageState.isCreating}
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={pageState.isCreating}
                        className="rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium"
                        style={{
                          background: 'var(--accent)',
                          color: 'white',
                          opacity: pageState.isCreating ? 0.7 : 1,
                        }}
                      >
                        {pageState.isCreating ? 'Creating…' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingPage(false)}
                        className="rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium"
                        style={{
                          border: '1px solid var(--bg-border-subtle)',
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div
                  className="overflow-hidden rounded-[var(--radius-md)]"
                  style={{ border: '1px solid var(--bg-border-subtle)' }}
                >
                  {group.nodes.length === 0 ? (
                    <div className="px-3 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {group.id === 'capability'
                        ? 'No capability pages yet.'
                        : group.id === 'content'
                          ? 'No custom pages yet.'
                          : 'No items yet.'}
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: 'var(--bg-border-subtle)' }}>
                      {group.nodes.map((node) => {
                        const isSelected =
                          node.type === 'region'
                            ? effectiveSelection.type === 'region' &&
                              effectiveSelection.regionKey === node.regionKey
                            : effectiveSelection.type === 'page' &&
                              effectiveSelection.pageId === node.pageId;

                        return (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() =>
                              setSelection(
                                node.type === 'region'
                                  ? { type: 'region', regionKey: node.regionKey }
                                  : { type: 'page', pageId: node.pageId },
                              )
                            }
                            className="w-full px-3 py-3 text-left transition-colors"
                            style={{
                              background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <div
                                  className="truncate text-sm font-medium"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {node.label}
                                </div>
                                <div
                                  className="truncate text-xs"
                                  style={{ color: 'var(--text-tertiary)' }}
                                >
                                  {node.type === 'region' ? node.description : node.path}
                                </div>
                              </div>
                              {node.type === 'page' && (
                                <div className="flex flex-col items-end gap-1">
                                  <span
                                    className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                    style={{
                                      background:
                                        node.pageClass === 'system'
                                          ? 'rgba(148, 163, 184, 0.12)'
                                          : node.pageClass === 'capability'
                                            ? 'rgba(168, 85, 247, 0.12)'
                                            : 'rgba(59, 130, 246, 0.12)',
                                      color: 'var(--text-secondary)',
                                    }}
                                  >
                                    {node.pageClass}
                                  </span>
                                  {!node.isPublished && (
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
                                  {node.hasUnpublishedChanges && node.isPublished && (
                                    <span
                                      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                      style={{
                                        background: 'rgba(34, 197, 94, 0.12)',
                                        color: 'rgb(21, 128, 61)',
                                      }}
                                    >
                                      changes
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section
          className="rounded-[var(--radius-lg)] p-4 space-y-4"
          style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Site view
                </h3>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {effectiveSelection.type === 'page'
                  ? `Focused on ${previewState.title}.`
                  : 'Focused on shared site areas.'}
              </p>
            </div>
            {previewUrl.url && (
              <a
                href={previewUrl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: 'var(--accent)' }}
              >
                <ExternalLink className="h-4 w-4" />
                Open page
              </a>
            )}
          </div>

          {(previewState.reason || previewUrl.note || pageState.error || regionState.error) && (
            <div className="space-y-2">
              {previewState.reason && (
                <div
                  className="flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm"
                  style={{
                    borderColor: 'rgba(245, 158, 11, 0.25)',
                    background: 'rgba(245, 158, 11, 0.08)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{previewState.reason}</span>
                </div>
              )}
              {previewUrl.note && (
                <div
                  className="rounded-[var(--radius-md)] border px-4 py-3 text-sm"
                  style={{
                    borderColor: 'var(--bg-border-subtle)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {previewUrl.note}
                </div>
              )}
            </div>
          )}

          <div
            className="overflow-hidden rounded-[var(--radius-lg)]"
            style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-elevated)' }}
          >
            {previewUrl.url ? (
              <iframe
                key={previewUrl.url}
                title="Storefront preview"
                src={previewUrl.url}
                className="h-[780px] w-full bg-white"
              />
            ) : (
              <div className="flex h-[780px] items-center justify-center px-8 text-center">
                <div className="max-w-md space-y-3">
                  <div
                    className="text-base font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Site view unavailable
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Finish the storefront setup for this environment and reload the editor.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="min-w-0">{renderInspector()}</div>
      </div>
    </div>
  );
}
