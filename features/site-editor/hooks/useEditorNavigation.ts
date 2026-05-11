'use client';

import { useEffect, useMemo, useState } from 'react';
import type { RegionMap, StorefrontPage } from '@/lib/types';
import { getDefaultStorefrontEditorSelection } from '@/features/settings/lib/storefrontEditor';
import {
  buildSiteEditorNavigatorPages,
  buildSiteEditorSiteWideNodes,
  getSelectedSiteEditorSection,
  type SiteEditorNavigatorPageNode,
  type SiteEditorNavigatorSharedNode,
  type SiteEditorOutlineNode,
  type SiteEditorPanelKey,
} from '../lib/siteEditor';

export function useEditorNavigation(pages: StorefrontPage[], regionsDraft: RegionMap | null) {
  const [activePanel, setActivePanel] = useState<SiteEditorPanelKey>('navigator');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isPanelPinned, setIsPanelPinned] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedOutlineNodeId, setSelectedOutlineNodeId] = useState<string | null>(null);
  // null = "not yet touched" — auto-expand effectivePageId until code/user sets it explicitly
  const [expandedPageIdsState, setExpandedPageIdsState] = useState<string[] | null>(null);

  const defaultSelection = useMemo(() => getDefaultStorefrontEditorSelection(pages), [pages]);

  const effectivePageId =
    selectedPageId ?? (defaultSelection.type === 'page' ? defaultSelection.pageId : null);

  const selectedPage = useMemo(
    () => (effectivePageId ? pages.find((p) => p.id === effectivePageId) ?? null : null),
    [effectivePageId, pages],
  );

  const navigatorPages = useMemo(() => buildSiteEditorNavigatorPages(pages), [pages]);

  const siteWideNodes = useMemo(
    () => buildSiteEditorSiteWideNodes(regionsDraft),
    [regionsDraft],
  );

  const selectedOutlineNode = useMemo<SiteEditorOutlineNode | null>(() => {
    if (!selectedOutlineNodeId) return null;
    for (const node of siteWideNodes) {
      if (node.id === selectedOutlineNodeId) return node;
    }
    for (const page of navigatorPages) {
      const section = page.sections.find((s) => s.id === selectedOutlineNodeId);
      if (section) return section;
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

  // When state is null (untouched), auto-expand the effective page so it's visible on first load.
  // Once any code or user action calls setExpandedPageIds, the explicit list takes over.
  const expandedPageIds = useMemo<string[]>(() => {
    if (expandedPageIdsState !== null) return expandedPageIdsState;
    return effectivePageId ? [effectivePageId] : [];
  }, [effectivePageId, expandedPageIdsState]);

  function setExpandedPageIds(ids: string[]) {
    setExpandedPageIdsState(ids);
  }

  useEffect(() => {
    if (!isPanelOpen || isPanelPinned) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsPanelOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPanelOpen, isPanelPinned]);

  function togglePageExpanded(pageId: string) {
    if (expandedPageIds.includes(pageId)) {
      if (selectedPage?.id === pageId && selectedOutlineNode?.type === 'section') {
        setSelectedOutlineNodeId(null);
      }
      setExpandedPageIdsState([]);
    } else {
      setExpandedPageIdsState([pageId]);
    }
  }

  function handlePanelButtonClick(panelKey: SiteEditorPanelKey) {
    if (panelKey === activePanel) {
      setIsPanelOpen((current) => !current);
      return;
    }
    setActivePanel(panelKey);
    setIsPanelOpen(true);
  }

  // Raw navigation actions — workspace wraps these with guard.requestNavigation
  function selectPage(pageId: string) {
    setSelectedPageId(pageId);
    setSelectedOutlineNodeId(null);
    setExpandedPageIdsState([pageId]);
  }

  function selectSharedNode(node: SiteEditorNavigatorSharedNode) {
    setActivePanel('siteWide');
    setSelectedOutlineNodeId(node.id);
  }

  function selectSectionNode(
    pageNode: SiteEditorNavigatorPageNode,
    node: Extract<SiteEditorOutlineNode, { type: 'section' }>,
  ) {
    setSelectedPageId(pageNode.pageId);
    setSelectedOutlineNodeId(node.id);
    setExpandedPageIdsState([pageNode.pageId]);
  }

  return {
    activePanel,
    isPanelOpen,
    setIsPanelOpen,
    isPanelPinned,
    setIsPanelPinned,
    selectedPageId,
    setSelectedPageId,
    selectedOutlineNodeId,
    setSelectedOutlineNodeId,
    expandedPageIds,
    setExpandedPageIds,
    defaultSelection,
    effectivePageId,
    selectedPage,
    navigatorPages,
    siteWideNodes,
    selectedOutlineNode,
    selectedSharedRegionKey,
    selectedPageSection,
    selectedSection,
    setActivePanel,
    togglePageExpanded,
    handlePanelButtonClick,
    selectPage,
    selectSharedNode,
    selectSectionNode,
  };
}
