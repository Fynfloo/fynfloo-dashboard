'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Files, Layers3, LayoutTemplate, Palette } from 'lucide-react';
import { useCurrentStore } from '@/hooks/useStore';
import { resolveStorefrontPreviewState } from '@/features/settings/lib/storefrontEditor';
import { useStorefrontPages } from '@/features/settings/hooks/useStorefrontPages';
import { useStorefrontRegions } from '@/features/settings/hooks/useStorefrontRegions';
import type { SiteEditorPanelKey } from '../lib/siteEditor';
import { applyHeroVariant, getHeroVariant } from '../lib/sectionEditing';
import { usePreviewSession } from '../hooks/usePreviewSession';
import { usePreviewBridge } from '../hooks/usePreviewBridge';
import { useEditorNavigation } from '../hooks/useEditorNavigation';
import { useEditorGuard } from '../hooks/useEditorGuard';
import { SiteEditorHeader } from './SiteEditorHeader';
import { SiteEditorSidebar } from './SiteEditorSidebar';
import { EditorLeftPanel } from './EditorLeftPanel';
import { EditorPreviewPanel } from './EditorPreviewPanel';
import { EditorInspector } from './EditorInspector';
import { NavigatorPanel } from './NavigatorPanel';
import { SiteWidePanel } from './SiteWidePanel';
import { BlocksPanel } from './BlocksPanel';
import { EmptyStateCard, UnsavedChangesDialog } from './SiteEditorUI';

const PANELS: Array<{ key: SiteEditorPanelKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'navigator', label: 'Pages', icon: Files },
  { key: 'siteWide', label: 'Shared', icon: Layers3 },
  { key: 'blocks', label: 'Blocks', icon: LayoutTemplate },
  { key: 'theme', label: 'Theme', icon: Palette },
];

const SAVE_BADGE: Record<string, { label: string; style: React.CSSProperties }> = {
  saving: { label: 'Saving…', style: { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' } },
  saved:  { label: 'Saved',   style: { background: 'var(--green-bg)', color: 'var(--green)' } },
  dirty:  { label: 'Unsaved edits', style: { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' } },
  error:  { label: 'Save failed', style: { background: 'rgba(239, 68, 68, 0.08)', color: 'rgb(153, 27, 27)' } },
};

export function SiteEditorWorkspace() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  const currentStore = useCurrentStore();
  const pageState = useStorefrontPages(storeId);
  const regionState = useStorefrontRegions(storeId);
  const nav = useEditorNavigation(pageState.pages, regionState.regions?.draft ?? null);

  const previewState = useMemo(
    () => resolveStorefrontPreviewState(
      nav.effectivePageId ? { type: 'page', pageId: nav.effectivePageId } : nav.defaultSelection,
      pageState.pages,
    ),
    [nav.defaultSelection, nav.effectivePageId, pageState.pages],
  );

  const session = usePreviewSession(storeId, previewState.path, previewState.requiresPreviewToken);
  const bridge = usePreviewBridge({
    previewMessagingOrigin: session.previewMessagingOrigin,
    previewUrlStr: session.previewUrl.url,
    previewRefreshKey: session.previewRefreshKey,
    selectedOutlineNode: nav.selectedOutlineNode,
    setSelectedOutlineNodeId: nav.setSelectedOutlineNodeId,
    refreshPreview: session.refreshPreview,
  });
  const guard = useEditorGuard({
    onLeaveWithoutSaving: () => { bridge.clearPreviewOverrides(); session.refreshPreview(); },
  });

  const activePanelMeta = PANELS.find((p) => p.key === nav.activePanel) ?? PANELS[0]!;
  const inspectorSaveBadge = bridge.inspectorSaveState ? (SAVE_BADGE[bridge.inspectorSaveState] ?? null) : null;

  async function handleCreatePage(name: string, path: string) {
    const page = await pageState.createPage({ name, path });
    if (!page) return;
    nav.setSelectedPageId(page.id);
    nav.setSelectedOutlineNodeId(null);
    nav.setExpandedPageIds([page.id]);
    nav.setActivePanel('navigator');
  }

  function clearAndRefresh() { bridge.clearPreviewOverrides(); session.refreshPreview(); }

  async function handlePagePublish(pageId: string) {
    const ok = await pageState.publish(pageId); if (ok) clearAndRefresh(); return ok;
  }
  async function handlePageDiscard(pageId: string) {
    const ok = await pageState.discard(pageId); if (ok) clearAndRefresh(); return ok;
  }
  async function handleRegionPublish() {
    const ok = await regionState.publish(); if (ok) clearAndRefresh(); return ok;
  }
  async function handleRegionDiscard() {
    const ok = await regionState.discard(); if (ok) clearAndRefresh(); return ok;
  }

  async function handleSectionSaveDraft(nextSection: NonNullable<typeof nav.selectedSection>) {
    if (!nav.selectedPage || !nav.selectedPageSection) return false;
    const nextLayout = nav.selectedPage.draft.layout.map((s, i) =>
      i === nav.selectedPageSection!.index ? nextSection : s,
    );
    const result = await pageState.saveDraft(nav.selectedPage.id, { layout: nextLayout });
    if (result && nav.selectedOutlineNode?.type === 'section') {
      bridge.setSectionOverride(nav.selectedOutlineNode.id, nextSection);
      bridge.scheduleNonLiveRefresh(nextSection.type);
    }
    return Boolean(result);
  }

  async function handleHeroVariantSelect(variant: ReturnType<typeof getHeroVariant>) {
    if (!nav.selectedSection || nav.selectedSection.type !== 'hero.basic') return;
    const next = applyHeroVariant(nav.selectedSection, variant);
    if (nav.selectedOutlineNode?.type === 'section') bridge.setSectionOverride(nav.selectedOutlineNode.id, next);
    await handleSectionSaveDraft(next);
  }

  function leftPanelContent() {
    if (nav.activePanel === 'navigator') return (
      <NavigatorPanel
        navigatorPages={nav.navigatorPages} selectedPage={nav.selectedPage}
        selectedOutlineNodeId={nav.selectedOutlineNodeId} expandedPageIds={nav.expandedPageIds}
        isCreating={pageState.isCreating} onToggleExpand={nav.togglePageExpanded}
        onSelectPage={(id) => guard.requestNavigation(() => nav.selectPage(id))}
        onSelectSection={(pn, n) => guard.requestNavigation(() => nav.selectSectionNode(pn, n))}
        onCreatePage={handleCreatePage}
      />
    );
    if (nav.activePanel === 'siteWide') return (
      <SiteWidePanel
        nodes={nav.siteWideNodes} selectedNodeId={nav.selectedOutlineNodeId}
        onSelectNode={(node) => guard.requestNavigation(() => nav.selectSharedNode(node))}
      />
    );
    if (nav.activePanel === 'blocks') return (
      <BlocksPanel
        selectedSharedRegionKey={nav.selectedSharedRegionKey} selectedOutlineNode={nav.selectedOutlineNode}
        selectedSection={nav.selectedSection} isSaving={pageState.isSaving}
        onHeroVariantSelect={(v) => void handleHeroVariantSelect(v)}
      />
    );
    return <EmptyStateCard body="Shared style options will appear here." />;
  }

  return (
    <div className="flex h-full flex-col">
      <SiteEditorHeader
        storeName={currentStore?.name} selectedOutlineNode={nav.selectedOutlineNode}
        selectedPage={nav.selectedPage} activePanel={nav.activePanel}
        inspectorSaveBadge={inspectorSaveBadge} previewUrl={session.previewUrl.url}
        onBack={() => guard.requestNavigation(() => router.push(`/dashboard/${storeId}`))}
        onOpenPage={() => guard.requestNavigation(() => window.open(session.previewUrl.url!, '_blank', 'noopener,noreferrer'))}
      />

      <div className="flex min-h-0 flex-1">
        <SiteEditorSidebar panels={PANELS} activePanel={nav.activePanel} isPanelOpen={nav.isPanelOpen} onPanelClick={nav.handlePanelButtonClick} />

        <div className="relative min-h-0 flex-1 flex">
          <EditorLeftPanel
            isPanelOpen={nav.isPanelOpen} isPanelPinned={nav.isPanelPinned}
            panelKey={activePanelMeta.key} panelLabel={activePanelMeta.label}
            onClose={() => nav.setIsPanelOpen(false)}
            onPin={() => nav.setIsPanelPinned(true)}
            onUnpin={() => nav.setIsPanelPinned(false)}
          >
            {leftPanelContent()}
          </EditorLeftPanel>

          <main className="relative min-w-0 flex-1 overflow-hidden p-5" style={{ background: 'var(--bg-base)' }}>
            <EditorPreviewPanel
              previewUrl={session.previewUrl} previewSessionNote={session.previewSessionNote}
              previewSessionError={session.previewSessionError} previewStateTitle={previewState.title}
              previewStateReason={previewState.reason} previewRefreshKey={session.previewRefreshKey}
              previewFrameRef={bridge.previewFrameRef} onFrameLoad={bridge.setIsPreviewFrameLoaded}
            />
          </main>
        </div>

        <aside className="w-[360px] shrink-0 overflow-y-auto px-5 py-5" style={{ background: 'var(--bg-base)', borderLeft: '1px solid var(--bg-border-subtle)' }}>
          <EditorInspector
            selectedSharedRegionKey={nav.selectedSharedRegionKey} selectedSection={nav.selectedSection}
            selectedOutlineNode={nav.selectedOutlineNode} selectedPage={nav.selectedPage}
            regionState={regionState} pageState={pageState}
            onSectionSaveDraft={handleSectionSaveDraft} onPagePublish={handlePagePublish}
            onPageDiscard={handlePageDiscard} onRegionPublish={handleRegionPublish}
            onRegionDiscard={handleRegionDiscard} onDirtyChange={guard.setHasUnsavedInspectorChanges}
            onSaveStateChange={bridge.setInspectorSaveState}
            onSectionPreviewChange={bridge.handleSectionPreviewChange}
            onRegionPreviewChange={bridge.handleRegionPreviewChange}
          />
        </aside>
      </div>

      <UnsavedChangesDialog
        open={guard.isUnsavedDialogOpen}
        onStay={guard.handleStayWithUnsavedChanges}
        onLeave={guard.handleLeaveWithUnsavedChanges}
      />
    </div>
  );
}
