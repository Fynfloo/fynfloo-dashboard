'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FilePlus2,
  Files,
  Layers3,
  LayoutTemplate,
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
  buildSiteEditorNavigatorPages,
  buildSiteEditorSiteWideNodes,
  getSelectedSiteEditorSection,
  type SiteEditorNavigatorPageNode,
  type SiteEditorNavigatorSharedNode,
  type SiteEditorOutlineNode,
  type SiteEditorPanelKey,
} from '../lib/siteEditor';
import { applyHeroVariant, getHeroVariant, HERO_VARIANT_OPTIONS } from '../lib/sectionEditing';
import { StorefrontSectionInspector } from './StorefrontSectionInspector';

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
  { key: 'navigator', label: 'Pages', icon: Files },
  { key: 'siteWide', label: 'Shared', icon: Layers3 },
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
  title?: string;
  body: string;
}) {
  return (
    <div
      className="rounded-[var(--radius-lg)] p-5"
      style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
    >
      {title ? (
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
      ) : null}
      <p
        className={title ? 'mt-2 text-sm' : 'text-sm'}
        style={{ color: 'var(--text-secondary)' }}
      >
        {body}
      </p>
    </div>
  );
}

function UnsavedChangesDialog({
  open,
  onStay,
  onLeave,
}: {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center px-6"
      style={{ background: 'rgba(15, 23, 42, 0.22)' }}
    >
      <div
        className="w-full max-w-md rounded-[var(--radius-xl)] p-5 shadow-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border-subtle)' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 rounded-full p-2"
            style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'rgb(180, 83, 9)' }}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Unsaved changes
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              You have changes that haven&apos;t been saved yet. Stay here to save them first, or
              leave without saving.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onStay}
            className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium"
            style={{
              border: '1px solid var(--bg-border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            Stay here
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium"
            style={{
              background: 'var(--accent)',
              color: 'white',
            }}
          >
            Leave without saving
          </button>
        </div>
      </div>
    </div>
  );
}

export function SiteEditorWorkspace() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  const currentStore = useCurrentStore();
  const pageState = useStorefrontPages(storeId);
  const regionState = useStorefrontRegions(storeId);

  const [activePanel, setActivePanel] = useState<SiteEditorPanelKey>('navigator');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isPanelPinned, setIsPanelPinned] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedOutlineNodeId, setSelectedOutlineNodeId] = useState<string | null>(null);
  const [expandedPageIds, setExpandedPageIds] = useState<string[]>([]);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPath, setCreatePath] = useState('');
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [previewSession, setPreviewSession] = useState<StorefrontPreviewSession | null>(null);
  const [isPreviewSessionLoading, setIsPreviewSessionLoading] = useState(false);
  const [previewSessionError, setPreviewSessionError] = useState<string | null>(null);
  const [hasUnsavedInspectorChanges, setHasUnsavedInspectorChanges] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false);

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

  const navigatorPages = useMemo(
    () => buildSiteEditorNavigatorPages(pageState.pages),
    [pageState.pages],
  );

  const siteWideNodes = useMemo(
    () => buildSiteEditorSiteWideNodes(regionState.regions?.draft ?? null),
    [regionState.regions],
  );

  const selectedOutlineNode = useMemo<SiteEditorOutlineNode | null>(() => {
    if (!selectedOutlineNodeId) return null;

    for (const node of siteWideNodes) {
      if (node.id === selectedOutlineNodeId) {
        return node;
      }
    }

    for (const page of navigatorPages) {
      const section = page.sections.find((entry) => entry.id === selectedOutlineNodeId);
      if (section) {
        return section;
      }
    }

    return null;
  }, [navigatorPages, selectedOutlineNodeId, siteWideNodes]);

  const selectedSharedRegionKey =
    selectedOutlineNode?.type === 'shared' ? selectedOutlineNode.regionKey : null;

  const selectedPageSection = useMemo(
    () => getSelectedSiteEditorSection(selectedPage, selectedOutlineNode),
    [selectedOutlineNode, selectedPage],
  );

  const selectedSection = selectedPageSection?.section ?? null;

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
    if (!effectivePageId) return;

    setExpandedPageIds((current) =>
      current.includes(effectivePageId) ? current : [effectivePageId],
    );
  }, [effectivePageId]);

  useEffect(() => {
    if (!hasUnsavedInspectorChanges) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedInspectorChanges]);

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

  function requestNavigation(action: () => void) {
    if (hasUnsavedInspectorChanges) {
      setPendingAction(() => action);
      setIsUnsavedDialogOpen(true);
      return;
    }

    action();
  }

  function handleStayWithUnsavedChanges() {
    setPendingAction(null);
    setIsUnsavedDialogOpen(false);
  }

  function handleLeaveWithUnsavedChanges() {
    const action = pendingAction;
    setPendingAction(null);
    setIsUnsavedDialogOpen(false);
    setHasUnsavedInspectorChanges(false);
    action?.();
  }

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
    setSelectedOutlineNodeId(null);
    setExpandedPageIds([page.id]);
    setActivePanel('navigator');
  }

  function handleSelectPage(pageId: string) {
    requestNavigation(() => {
      setSelectedPageId(pageId);
      setSelectedOutlineNodeId(null);
      setExpandedPageIds([pageId]);
    });
  }

  function handleSelectSharedNode(node: SiteEditorNavigatorSharedNode) {
    requestNavigation(() => {
      setActivePanel('siteWide');
      setSelectedOutlineNodeId(node.id);
    });
  }

  function handleSelectSectionNode(
    pageNode: SiteEditorNavigatorPageNode,
    node: Extract<SiteEditorOutlineNode, { type: 'section' }>,
  ) {
    requestNavigation(() => {
      setSelectedPageId(pageNode.pageId);
      setSelectedOutlineNodeId(node.id);
      setExpandedPageIds([pageNode.pageId]);
    });
  }

  function togglePageExpanded(pageId: string) {
    setExpandedPageIds((current) => {
      const isExpanded = current.includes(pageId);
      if (isExpanded) {
        const selectedSectionBelongsToPage =
          selectedPage?.id === pageId && selectedOutlineNode?.type === 'section';

        if (selectedSectionBelongsToPage) {
          setSelectedOutlineNodeId(null);
        }

        return [];
      }

      return [pageId];
    });
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

  async function handleSectionSaveDraft(nextSection: NonNullable<typeof selectedSection>) {
    if (!selectedPage || !selectedPageSection) {
      return false;
    }

    const nextLayout = selectedPage.draft.layout.map((section, index) =>
      index === selectedPageSection.index ? nextSection : section,
    );

    const result = await handlePageSaveDraft(selectedPage.id, {
      layout: nextLayout,
    });

    return Boolean(result);
  }

  async function handleHeroVariantSelect(variant: ReturnType<typeof getHeroVariant>) {
    if (!selectedSection || selectedSection.type !== 'hero.basic') {
      return;
    }

    const nextSection = applyHeroVariant(selectedSection, variant);
    await handleSectionSaveDraft(nextSection);
  }

  function renderNavigatorPanel() {
    return (
      <div className="space-y-5">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Choose a page and open the parts you want to edit.
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

        <div
          className="overflow-hidden rounded-[var(--radius-md)]"
          style={{ border: '1px solid var(--bg-border-subtle)' }}
          role="tree"
          aria-label="Pages"
        >
          {navigatorPages.length === 0 ? (
            <div className="px-4 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              No pages here yet.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--bg-border-subtle)' }}>
              {navigatorPages.map((node) => {
                const isSelectedPage = selectedPage?.id === node.pageId && !selectedOutlineNodeId;
                const isExpanded = expandedPageIds.includes(node.pageId);

                return (
                  <div
                    key={node.id}
                    className="bg-[var(--bg-surface)]"
                    role="treeitem"
                    aria-expanded={isExpanded}
                    aria-selected={isSelectedPage}
                  >
                    <div className="flex items-stretch">
                      <button
                        type="button"
                        aria-label={isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
                        onClick={() => togglePageExpanded(node.pageId)}
                        className="px-3"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPage(node.pageId)}
                        className="flex-1 px-4 py-3 text-left transition-colors"
                        style={{
                          background: isSelectedPage ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
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
                    </div>

                    {isExpanded && (
                      <div
                        role="group"
                        className="space-y-1 px-4 pb-3 pt-1"
                        style={{ borderTop: '1px solid var(--bg-border-subtle)' }}
                      >
                        {node.sections.length === 0 ? (
                          <div className="py-2 pl-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            No sections on this page yet.
                          </div>
                        ) : (
                          node.sections.map((section) => {
                            const isSelectedSection =
                              selectedPage?.id === node.pageId &&
                              section.id === selectedOutlineNodeId;

                            return (
                              <button
                                key={`${node.pageId}:${section.id}`}
                                type="button"
                                role="treeitem"
                                aria-selected={isSelectedSection}
                                onClick={() => handleSelectSectionNode(node, section)}
                                className="flex w-full items-center justify-between rounded-[var(--radius-md)] py-2 pl-8 pr-3 text-left transition-colors"
                                style={{
                                  background: isSelectedSection
                                    ? 'rgba(59, 130, 246, 0.08)'
                                    : 'transparent',
                                }}
                              >
                                <div className="space-y-1">
                                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    {section.label}
                                  </div>
                                </div>
                                {section.meta && (
                                  <span
                                    className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                                  >
                                    {section.meta}
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderSiteWidePanel() {
    return (
      <div className="space-y-5">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Edit the areas that can appear across your site.
        </p>

        <div className="space-y-3">
          {siteWideNodes.length === 0 ? (
            <EmptyStateCard body="There are no shared areas ready to edit yet." />
          ) : (
            siteWideNodes.map((node) => {
              const isSelected = node.id === selectedOutlineNodeId;

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => handleSelectSharedNode(node)}
                  className="w-full rounded-[var(--radius-lg)] p-4 text-left transition-colors"
                  style={{
                    background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
                    border: isSelected
                      ? '1px solid rgba(59, 130, 246, 0.28)'
                      : '1px solid var(--bg-border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {node.label}
                      </div>
                    </div>
                    {node.meta ? (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                      >
                        {node.meta}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  function renderBlocksPanel() {
    if (selectedSharedRegionKey) {
      return (
        <EmptyStateCard body="Layout choices for this area will appear here as more shared layouts are added." />
      );
    }

    if (!selectedOutlineNode || !selectedSection) {
      return (
        <EmptyStateCard body="Choose a section in Pages to change its layout." />
      );
    }

    if (selectedSection.type !== 'hero.basic') {
      return (
        <EmptyStateCard body="Alternate layouts for this section will appear here as they are added." />
      );
    }

    const currentVariant = getHeroVariant(selectedSection);

    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Choose the hero layout that best fits this page.
        </p>

        <div className="space-y-3">
          {HERO_VARIANT_OPTIONS.map((option) => {
            const selected = currentVariant === option.key;

            return (
              <div
                key={option.key}
                className="rounded-[var(--radius-lg)] p-4"
                style={{
                  border: selected
                    ? '1px solid rgba(59, 130, 246, 0.45)'
                    : '1px solid var(--bg-border-subtle)',
                  background: selected
                    ? 'rgba(59, 130, 246, 0.08)'
                    : 'var(--bg-surface)',
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {option.label}
                    </div>
                    {selected && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--accent)' }}
                      >
                        current
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {option.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleHeroVariantSelect(option.key)}
                  disabled={pageState.isSaving || selected}
                  className="mt-4 inline-flex items-center rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium"
                  style={{
                    background: selected ? 'var(--bg-elevated)' : 'var(--accent)',
                    color: selected ? 'var(--text-secondary)' : 'white',
                    opacity: pageState.isSaving ? 0.7 : 1,
                  }}
                >
                  {selected ? 'Current layout' : `Use ${option.label}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderThemePanel() {
    return (
      <EmptyStateCard body="Shared style options will appear here." />
    );
  }

  function renderLeftPanel() {
    switch (activePanel) {
      case 'navigator':
        return renderNavigatorPanel();
      case 'siteWide':
        return renderSiteWidePanel();
      case 'blocks':
        return renderBlocksPanel();
      case 'theme':
        return renderThemePanel();
    }
  }

  function renderInspector() {
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
          onDirtyChange={setHasUnsavedInspectorChanges}
        />
      );
    }

    if (selectedSection) {
      return (
        <StorefrontSectionInspector
          key={selectedOutlineNode?.id ?? 'section'}
          section={selectedSection}
          sectionLabel={selectedOutlineNode?.label ?? 'Section'}
          isSaving={pageState.isSaving}
          error={pageState.error}
          saveDraft={handleSectionSaveDraft}
          onDirtyChange={setHasUnsavedInspectorChanges}
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
        saveDraft={handlePageSaveDraft}
        publish={handlePagePublish}
        discard={handlePageDiscard}
        onDirtyChange={setHasUnsavedInspectorChanges}
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
          <button
            type="button"
            onClick={() => requestNavigation(() => router.push(`/dashboard/${storeId}`))}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
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
            {selectedOutlineNode?.type === 'shared'
              ? selectedOutlineNode.label
              : selectedPage?.name?.trim() || selectedPage?.path || 'Select a page'}
          </div>
          <div className="truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {activePanel === 'navigator'
              ? 'Pages'
              : activePanel === 'siteWide'
                ? 'Shared'
              : activePanel === 'blocks'
                ? 'Blocks'
                : 'Theme'}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {previewUrl.url && (
            <button
              type="button"
              onClick={() =>
                requestNavigation(() => {
                  window.open(previewUrl.url!, '_blank', 'noopener,noreferrer');
                })
              }
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium"
              style={{
                border: '1px solid var(--bg-border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Open page
            </button>
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

      <UnsavedChangesDialog
        open={isUnsavedDialogOpen}
        onStay={handleStayWithUnsavedChanges}
        onLeave={handleLeaveWithUnsavedChanges}
      />
    </div>
  );
}
