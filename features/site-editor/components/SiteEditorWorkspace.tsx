'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  FilePlus2,
  Files,
  FolderTree,
  LayoutTemplate,
  ListTree,
  Palette,
  X,
} from 'lucide-react';
import { UserMenu } from '@/components/layout/UserMenu';
import { useCurrentStore } from '@/hooks/useStore';
import { apiRequest } from '@/lib/api';
import type { StorefrontPreviewSession } from '@/lib/types';
import { StorefrontPageInspector } from '@/features/settings/components/StorefrontPageInspector';
import { StorefrontRegionInspector } from '@/features/settings/components/StorefrontRegionInspector';
import { buildStorefrontPreviewUrl, getDefaultStorefrontEditorSelection, resolveStorefrontPreviewState } from '@/features/settings/lib/storefrontEditor';
import { useStorefrontPages } from '@/features/settings/hooks/useStorefrontPages';
import { useStorefrontRegions } from '@/features/settings/hooks/useStorefrontRegions';
import {
  buildSiteEditorOutlineGroups,
  buildSiteEditorPageGroups,
  type SiteEditorOutlineNode,
  type SiteEditorPanelKey,
} from '../lib/siteEditor';

const CONFIGURED_PREVIEW_ORIGIN = process.env.NEXT_PUBLIC_STOREFRONT_EDITOR_ORIGIN;

async function createStorefrontPreviewSession(
  tenantId: string,
): Promise<StorefrontPreviewSession> {
  return apiRequest<StorefrontPreviewSession>(
    `/api/tenant/${tenantId}/settings/storefront/preview-session`,
    {
      method: 'POST',
    },
  );
}

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

const PANELS: Array<{
  key: SiteEditorPanelKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'pages', label: 'Pages', icon: Files },
  { key: 'outline', label: 'Outline', icon: ListTree },
  { key: 'blocks', label: 'Blocks', icon: LayoutTemplate },
  { key: 'theme', label: 'Theme', icon: Palette },
];

function PanelButton({
  active,
  controlsId,
  expanded,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  controlsId: string;
  expanded: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-controls={controlsId}
      aria-expanded={expanded}
      onClick={onClick}
      className="flex w-full flex-col items-center gap-2 rounded-[var(--radius-md)] px-2 py-3 text-[11px] font-medium transition-colors"
      style={{
        background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
      }}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

function EmptyStateCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div
      className="rounded-[var(--radius-lg)] p-5"
      style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
    >
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        {body}
      </p>
    </div>
  );
}

export function SiteEditorWorkspace() {
  const params = useParams();
  const storeId = params.storeId as string;
  const currentStore = useCurrentStore();
  const pageState = useStorefrontPages(storeId);
  const regionState = useStorefrontRegions(storeId);

  const [activePanel, setActivePanel] = useState<SiteEditorPanelKey>('pages');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isPanelPinned, setIsPanelPinned] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedOutlineNodeId, setSelectedOutlineNodeId] = useState<string | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPath, setCreatePath] = useState('');
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [previewSession, setPreviewSession] = useState<StorefrontPreviewSession | null>(null);
  const [isPreviewSessionLoading, setIsPreviewSessionLoading] = useState(false);
  const [previewSessionError, setPreviewSessionError] = useState<string | null>(null);

  const currentOrigin = useSyncExternalStore(
    subscribeToLocationOrigin,
    getLocationOriginSnapshot,
    () => null,
  );

  const loadPreviewSession = useCallback(async () => {
    if (!storeId) return;

    setIsPreviewSessionLoading(true);
    setPreviewSessionError(null);

    try {
      const session = await createStorefrontPreviewSession(storeId);
      setPreviewSession(session);
    } catch (err) {
      const apiError = err as { message?: string };
      setPreviewSession(null);
      setPreviewSessionError(apiError.message ?? 'Could not open the current page view');
    } finally {
      setIsPreviewSessionLoading(false);
    }
  }, [storeId]);

  const defaultSelection = useMemo(
    () => getDefaultStorefrontEditorSelection(pageState.pages),
    [pageState.pages],
  );

  const effectivePageId =
    selectedPageId ??
    (defaultSelection.type === 'page' ? defaultSelection.pageId : null);

  const selectedPage = useMemo(
    () =>
      effectivePageId
        ? pageState.pages.find((page) => page.id === effectivePageId) ?? null
        : null,
    [effectivePageId, pageState.pages],
  );

  const pageGroups = useMemo(
    () => buildSiteEditorPageGroups(pageState.pages),
    [pageState.pages],
  );

  const outlineGroups = useMemo(
    () => buildSiteEditorOutlineGroups(selectedPage, regionState.regions?.draft ?? null),
    [regionState.regions, selectedPage],
  );

  const selectedOutlineNode = useMemo<SiteEditorOutlineNode | null>(() => {
    if (!selectedOutlineNodeId) return null;

    for (const group of outlineGroups) {
      const node = group.nodes.find((entry) => entry.id === selectedOutlineNodeId);
      if (node) return node;
    }

    return null;
  }, [outlineGroups, selectedOutlineNodeId]);

  const selectedSharedRegionKey =
    selectedOutlineNode?.type === 'shared' ? selectedOutlineNode.regionKey : null;

  const previewState = useMemo(
    () =>
      resolveStorefrontPreviewState(
        effectivePageId
          ? { type: 'page', pageId: effectivePageId }
          : defaultSelection,
        pageState.pages,
      ),
    [defaultSelection, effectivePageId, pageState.pages],
  );

  const previewUrl = useMemo(
    () =>
      buildStorefrontPreviewUrl({
        subdomain: currentStore?.subdomain ?? null,
        path: previewState.path,
        currentOrigin,
        configuredOrigin: CONFIGURED_PREVIEW_ORIGIN,
        previewToken: previewSession?.token ?? null,
        // Site editor preview should always boot through the protected
        // storefront preview session so draft shell changes are available
        // immediately and the iframe doesn't flash from live -> preview.
        requiresPreviewToken:
          Boolean(currentStore?.subdomain) || previewState.requiresPreviewToken,
      }),
    [
      currentOrigin,
      currentStore?.subdomain,
      previewSession?.token,
      previewState.path,
      previewState.requiresPreviewToken,
    ],
  );

  const previewSessionNote = previewSessionError
    ? `Current page unavailable: ${previewSessionError}`
    : isPreviewSessionLoading
      ? 'Opening your site view…'
      : null;

  useEffect(() => {
    void loadPreviewSession();
  }, [loadPreviewSession]);

  useEffect(() => {
    if (!previewSession?.expiresAt) return;

    const expiresAtMs = new Date(previewSession.expiresAt).getTime();
    if (Number.isNaN(expiresAtMs)) return;

    const refreshDelayMs = Math.max(expiresAtMs - Date.now() - 60_000, 0);
    const timer = window.setTimeout(() => {
      void loadPreviewSession();
    }, refreshDelayMs);

    return () => window.clearTimeout(timer);
  }, [loadPreviewSession, previewSession?.expiresAt]);

  useEffect(() => {
    if (!isPanelOpen || isPanelPinned) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsPanelOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen, isPanelPinned]);

  const activePanelMeta = useMemo(
    () => PANELS.find((panel) => panel.key === activePanel) ?? PANELS[0],
    [activePanel],
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
    setSelectedPageId(page.id);
    setActivePanel('pages');
  }

  function handlePanelButtonClick(panelKey: SiteEditorPanelKey) {
    if (panelKey === activePanel) {
      setIsPanelOpen((current) => !current);
      return;
    }

    setActivePanel(panelKey);
    setIsPanelOpen(true);
  }

  function refreshPreview() {
    setPreviewRefreshKey((current) => current + 1);
  }

  async function handlePageSaveDraft(
    pageId: string,
    input: Parameters<typeof pageState.saveDraft>[1],
  ) {
    const result = await pageState.saveDraft(pageId, input);
    if (result) {
      refreshPreview();
    }

    return result;
  }

  async function handlePagePublish(pageId: string) {
    const result = await pageState.publish(pageId);
    if (result) {
      refreshPreview();
    }

    return result;
  }

  async function handlePageDiscard(pageId: string) {
    const result = await pageState.discard(pageId);
    if (result) {
      refreshPreview();
    }

    return result;
  }

  async function handleRegionSaveDraft(draft: Parameters<typeof regionState.saveDraft>[0]) {
    const ok = await regionState.saveDraft(draft);
    if (ok) {
      refreshPreview();
    }

    return ok;
  }

  async function handleRegionPublish() {
    const ok = await regionState.publish();
    if (ok) {
      refreshPreview();
    }

    return ok;
  }

  async function handleRegionDiscard() {
    const ok = await regionState.discard();
    if (ok) {
      refreshPreview();
    }

    return ok;
  }

  function renderPagesPanel() {
    return (
      <div className="space-y-5">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Choose a page to edit or add a new one.
        </p>

        <div className="rounded-[var(--radius-md)]" style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}>
          <button
            type="button"
            onClick={() => setIsCreatingPage((current) => !current)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
            style={{ color: 'var(--text-primary)' }}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <FilePlus2 className="h-4 w-4" />
              New content page
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {isCreatingPage ? 'Hide' : 'Show'}
            </span>
          </button>

          {isCreatingPage && (
            <form
              onSubmit={handleCreatePage}
              className="space-y-3 border-t px-4 py-4"
              style={{ borderColor: 'var(--bg-border-subtle)' }}
            >
              <TextInput
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="Page name"
                disabled={pageState.isCreating}
              />
              <TextInput
                value={createPath}
                onChange={(event) => setCreatePath(event.target.value)}
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
                  {pageState.isCreating ? 'Creating…' : 'Create page'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingPage(false)}
                  className="rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium"
                  style={{
                    border: '1px solid var(--bg-border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-4">
          {pageGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-tertiary)' }}>
                  {group.label}
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {group.description}
                </p>
              </div>

              <div className="overflow-hidden rounded-[var(--radius-md)]" style={{ border: '1px solid var(--bg-border-subtle)' }}>
                {group.nodes.length === 0 ? (
                  <div className="px-4 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No pages here yet.
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--bg-border-subtle)' }}>
                    {group.nodes.map((node) => {
                      const selected = selectedPage?.id === node.pageId;

                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => {
                            setSelectedPageId(node.pageId);
                            setSelectedOutlineNodeId(null);
                          }}
                          className="w-full px-4 py-3 text-left transition-colors"
                          style={{
                            background: selected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {node.label}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {node.path}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {!node.isPublished && (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                  style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'rgb(180, 83, 9)' }}
                                >
                                  draft only
                                </span>
                              )}
                              {node.hasUnpublishedChanges && node.isPublished && (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                  style={{ background: 'rgba(34, 197, 94, 0.12)', color: 'rgb(21, 128, 61)' }}
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
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderOutlinePanel() {
    return (
      <div className="space-y-5">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Select a section or site-wide area to edit it.
        </p>

        <div className="space-y-4">
          {outlineGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  <FolderTree className="h-4 w-4" />
                  {group.label}
                  {group.shared && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                    >
                      site-wide
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {group.description}
                </p>
              </div>

              <div className="overflow-hidden rounded-[var(--radius-md)]" style={{ border: '1px solid var(--bg-border-subtle)' }}>
                {group.nodes.length === 0 ? (
                  <div className="px-4 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {group.id === 'template'
                      ? 'No sections on this page yet.'
                      : 'Nothing here yet.'}
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--bg-border-subtle)' }}>
                    {group.nodes.map((node) => {
                      const isSelected = node.id === selectedOutlineNodeId;

                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => setSelectedOutlineNodeId(node.id)}
                          className="w-full px-4 py-3 text-left transition-colors"
                          style={{
                            background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {node.label}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {node.type === 'shared' ? 'Site-wide item' : 'Section'}
                              </div>
                            </div>
                            {node.meta && (
                              <span
                                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                              >
                                {node.meta}
                              </span>
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
      </div>
    );
  }

  function renderBlocksPanel() {
    return (
      <EmptyStateCard
        title="Blocks"
        body="New blocks for this page will appear here."
      />
    );
  }

  function renderThemePanel() {
    return (
      <EmptyStateCard
        title="Theme"
        body="Site-wide style options will appear here."
      />
    );
  }

  function renderLeftPanel() {
    switch (activePanel) {
      case 'pages':
        return renderPagesPanel();
      case 'outline':
        return renderOutlinePanel();
      case 'blocks':
        return renderBlocksPanel();
      case 'theme':
        return renderThemePanel();
    }
  }

  function renderInspector() {
    if (activePanel === 'pages') {
      return (
        <StorefrontPageInspector
          page={selectedPage}
          isLoading={pageState.isLoading}
          isSaving={pageState.isSaving}
          isPublishing={pageState.isPublishing}
          isDiscarding={pageState.isDiscarding}
          error={pageState.error}
          saveDraft={handlePageSaveDraft}
          publish={handlePagePublish}
          discard={handlePageDiscard}
        />
      );
    }

    if (activePanel === 'outline') {
      if (selectedSharedRegionKey) {
        return (
          <StorefrontRegionInspector
            regionKey={selectedSharedRegionKey}
            regions={regionState.regions}
            isLoading={regionState.isLoading}
            isSaving={regionState.isSaving}
            isPublishing={regionState.isPublishing}
            isDiscarding={regionState.isDiscarding}
            error={regionState.error}
            saveDraft={handleRegionSaveDraft}
            publish={handleRegionPublish}
            discard={handleRegionDiscard}
          />
        );
      }

      if (!selectedOutlineNode) {
        return (
          <EmptyStateCard
            title="Outline"
            body="Select something from the outline to edit it here."
          />
        );
      }

      return (
        <EmptyStateCard
          title={selectedOutlineNode.label}
          body="Section editing will appear here."
        />
      );
    }

    if (activePanel === 'blocks') {
      return (
        <EmptyStateCard
          title="Blocks"
          body="Block details will appear here."
        />
      );
    }

    return (
      <EmptyStateCard
        title="Theme"
        body="Theme details will appear here."
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header
        className="flex h-14 items-center gap-4 px-4"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--bg-border-subtle)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/${storeId}`}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {currentStore?.name ?? 'Site'}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Site editor
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {selectedPage?.name?.trim() || selectedPage?.path || 'Select a page'}
          </div>
          <div className="truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {activePanel === 'pages'
              ? 'Pages'
              : activePanel === 'outline'
                ? 'Outline'
                : activePanel === 'blocks'
                  ? 'Blocks'
                  : 'Theme'}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {previewUrl.url && (
            <a
              href={previewUrl.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium"
              style={{
                border: '1px solid var(--bg-border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Open page
            </a>
          )}
          <UserMenu />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className="flex w-[76px] flex-col items-stretch gap-2 px-2 py-3"
          style={{
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--bg-border-subtle)',
          }}
        >
          {PANELS.map((panel) => (
            <PanelButton
              key={panel.key}
              active={panel.key === activePanel}
              controlsId={`${panel.key}-panel`}
              expanded={panel.key === activePanel && isPanelOpen}
              icon={panel.icon}
              label={panel.label}
              onClick={() => handlePanelButtonClick(panel.key)}
            />
          ))}
        </aside>

        <div className="relative min-w-0 flex-1 flex">
          {isPanelOpen && isPanelPinned && (
            <section
              id={`${activePanelMeta.key}-panel`}
              aria-label={`${activePanelMeta.label} panel`}
              className="w-[340px] shrink-0 overflow-hidden"
              style={{
                background: 'var(--bg-base)',
                borderRight: '1px solid var(--bg-border-subtle)',
              }}
            >
              <div className="flex h-full flex-col">
                <div
                  className="flex items-center justify-between gap-3 px-5 py-4"
                  style={{
                    background: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--bg-border-subtle)',
                  }}
                >
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {activePanelMeta.label}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Unpin panel"
                      onClick={() => setIsPanelPinned(false)}
                      className="rounded-[var(--radius-md)] px-2.5 py-2 text-xs font-medium"
                      style={{
                        border: '1px solid var(--bg-border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Unpin
                    </button>
                    <button
                      type="button"
                      aria-label="Close panel"
                      onClick={() => setIsPanelOpen(false)}
                      className="rounded-[var(--radius-md)] p-2"
                      style={{
                        border: '1px solid var(--bg-border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-5">{renderLeftPanel()}</div>
              </div>
            </section>
          )}

          <main className="relative min-w-0 flex-1 overflow-hidden p-5" style={{ background: 'var(--bg-base)' }}>
            {!isPanelPinned && isPanelOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close overlay panel"
                  className="absolute inset-0 z-10 cursor-default"
                  style={{ background: 'rgba(13, 13, 26, 0.08)' }}
                  onClick={() => setIsPanelOpen(false)}
                />

                <section
                  id={`${activePanelMeta.key}-panel`}
                  aria-label={`${activePanelMeta.label} panel`}
                  className="absolute left-5 top-5 bottom-5 z-20 w-[340px] overflow-hidden rounded-[var(--radius-xl)]"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-border-subtle)',
                    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
                  }}
                >
                  <div className="flex h-full flex-col">
                    <div
                      className="flex items-center justify-between gap-3 px-5 py-4"
                      style={{ borderBottom: '1px solid var(--bg-border-subtle)' }}
                    >
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {activePanelMeta.label}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Pin panel"
                          onClick={() => setIsPanelPinned(true)}
                          className="rounded-[var(--radius-md)] px-2.5 py-2 text-xs font-medium"
                          style={{
                            border: '1px solid var(--bg-border-subtle)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Pin
                        </button>
                        <button
                          type="button"
                          aria-label="Close panel"
                          onClick={() => setIsPanelOpen(false)}
                          className="rounded-[var(--radius-md)] p-2"
                          style={{
                            border: '1px solid var(--bg-border-subtle)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 py-5">{renderLeftPanel()}</div>
                  </div>
                </section>
              </>
            )}

            <div
              className="flex h-full flex-col overflow-hidden rounded-[var(--radius-xl)]"
              style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
            >
              <div
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid var(--bg-border-subtle)' }}
              >
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Site view
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Changes appear here as you move through the site.
                  </div>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {previewState.title}
                </div>
              </div>

              {(previewState.reason || previewSessionNote || previewUrl.note) && (
                <div className="space-y-2 px-4 pt-4">
                  {previewState.reason && (
                    <div
                      className="rounded-[var(--radius-md)] border px-4 py-3 text-sm"
                      style={{
                        borderColor: 'rgba(245, 158, 11, 0.25)',
                        background: 'rgba(245, 158, 11, 0.08)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {previewState.reason}
                    </div>
                  )}
                  {previewSessionNote && (
                    <div
                      className="rounded-[var(--radius-md)] border px-4 py-3 text-sm"
                      style={{
                        borderColor: previewSessionError
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'var(--bg-border-subtle)',
                        background: previewSessionError
                          ? 'rgba(239, 68, 68, 0.08)'
                          : 'var(--bg-elevated)',
                        color: previewSessionError
                          ? 'var(--text-primary)'
                          : 'var(--text-secondary)',
                      }}
                    >
                      {previewSessionNote}
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

              <div className="min-h-0 flex-1 p-4">
                <div
                  className="h-full overflow-hidden rounded-[var(--radius-lg)]"
                  style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-elevated)' }}
                >
                  {previewUrl.url ? (
                    <iframe
                      key={`${previewUrl.url}:${previewRefreshKey}`}
                      title="Site editor preview"
                      src={previewUrl.url}
                      className="h-full w-full bg-white"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-8 text-center">
                      <div className="max-w-md space-y-3">
                        <div className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Site view unavailable
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Finish the site setup for this environment and reload the editor.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>

        <aside
          className="w-[360px] shrink-0 overflow-y-auto px-5 py-5"
          style={{
            background: 'var(--bg-base)',
            borderLeft: '1px solid var(--bg-border-subtle)',
          }}
        >
          {renderInspector()}
        </aside>
      </div>
    </div>
  );
}
