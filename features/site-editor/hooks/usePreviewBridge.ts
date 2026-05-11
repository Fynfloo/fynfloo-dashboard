'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RegionMap, StorefrontSection } from '@/lib/types';
import {
  postSiteEditorPreviewMessage,
  SITE_EDITOR_PREVIEW_SOURCE,
  type SiteEditorPreviewMessage,
} from '../lib/previewBridge';
import type { SiteEditorOutlineNode } from '../lib/siteEditor';
import type { SiteEditorSaveState } from '../lib/useSiteEditorDraftSession';

const LIVE_PREVIEW_SECTION_TYPES = new Set<string>([
  'hero.basic',
  'content.textWithMedia',
  'content.testimonials',
  'commerce.categoryGrid',
]);

export function usePreviewBridge({
  previewMessagingOrigin,
  previewUrlStr,
  previewRefreshKey,
  selectedOutlineNode,
  setSelectedOutlineNodeId,
  refreshPreview,
}: {
  previewMessagingOrigin: string | null;
  previewUrlStr: string | null;
  previewRefreshKey: number;
  selectedOutlineNode: SiteEditorOutlineNode | null;
  setSelectedOutlineNodeId: (id: string | null) => void;
  refreshPreview: () => void;
}) {
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);

  // Key-based loaded/ready tracking: derive boolean from whether the "last confirmed" key
  // matches the current stable key. Avoids setState-in-effect reset pattern.
  const stableKey = `${previewUrlStr ?? ''}:${previewRefreshKey}`;

  const [frameLoadedKey, setFrameLoadedKey] = useState('');
  const [bridgeReadyKey, setBridgeReadyKey] = useState('');

  const isPreviewFrameLoaded = frameLoadedKey === stableKey;
  const isPreviewBridgeReady = bridgeReadyKey === stableKey;

  const [previewSectionOverrides, setPreviewSectionOverrides] = useState<
    Record<string, StorefrontSection>
  >({});
  const [previewRegionOverrides, setPreviewRegionOverrides] = useState<RegionMap | null>(null);
  const [inspectorSaveState, setInspectorSaveState] = useState<SiteEditorSaveState>('idle');
  const pendingNonLiveRefreshRef = useRef(false);
  const prevInspectorSaveStateRef = useRef<SiteEditorSaveState>('idle');

  useEffect(() => {
    if (!previewMessagingOrigin) return;

    function handleMessage(event: MessageEvent<SiteEditorPreviewMessage>) {
      if (event.origin !== previewMessagingOrigin) return;
      if (event.source !== previewFrameRef.current?.contentWindow) return;
      if (!event.data || event.data.source !== SITE_EDITOR_PREVIEW_SOURCE) return;

      if (event.data.type === 'site-editor:ready') {
        setBridgeReadyKey(stableKey);
        return;
      }

      if (event.data.type === 'site-editor:node-click') {
        setSelectedOutlineNodeId(event.data.nodeId);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [previewMessagingOrigin, setSelectedOutlineNodeId, stableKey]);

  useEffect(() => {
    if (!isPreviewFrameLoaded || !isPreviewBridgeReady) return;
    postSiteEditorPreviewMessage(
      previewFrameRef.current?.contentWindow ?? null,
      previewMessagingOrigin,
      {
        source: SITE_EDITOR_PREVIEW_SOURCE,
        type: 'site-editor:select-node',
        nodeId: selectedOutlineNode?.id ?? null,
      },
    );
  }, [isPreviewBridgeReady, isPreviewFrameLoaded, previewMessagingOrigin, selectedOutlineNode?.id]);

  useEffect(() => {
    if (!isPreviewFrameLoaded || !isPreviewBridgeReady) return;
    const target = previewFrameRef.current?.contentWindow ?? null;
    Object.entries(previewSectionOverrides).forEach(([nodeId, section]) => {
      postSiteEditorPreviewMessage(target, previewMessagingOrigin, {
        source: SITE_EDITOR_PREVIEW_SOURCE,
        type: 'site-editor:preview-section',
        nodeId,
        section,
      });
    });
  }, [isPreviewBridgeReady, isPreviewFrameLoaded, previewMessagingOrigin, previewSectionOverrides]);

  useEffect(() => {
    if (!isPreviewFrameLoaded || !isPreviewBridgeReady) return;
    postSiteEditorPreviewMessage(
      previewFrameRef.current?.contentWindow ?? null,
      previewMessagingOrigin,
      {
        source: SITE_EDITOR_PREVIEW_SOURCE,
        type: 'site-editor:preview-regions',
        regions: previewRegionOverrides,
      },
    );
  }, [isPreviewBridgeReady, isPreviewFrameLoaded, previewMessagingOrigin, previewRegionOverrides]);

  useEffect(() => {
    const prev = prevInspectorSaveStateRef.current;
    prevInspectorSaveStateRef.current = inspectorSaveState;
    if (prev === 'saving' && inspectorSaveState === 'saved' && pendingNonLiveRefreshRef.current) {
      pendingNonLiveRefreshRef.current = false;
      refreshPreview();
    }
  }, [inspectorSaveState, refreshPreview]);

  const clearPreviewOverrides = useCallback(() => {
    setPreviewSectionOverrides({});
    setPreviewRegionOverrides(null);
  }, []);

  const setSectionOverride = useCallback((nodeId: string, section: StorefrontSection) => {
    setPreviewSectionOverrides((current) => ({ ...current, [nodeId]: section }));
  }, []);

  const scheduleNonLiveRefresh = useCallback((sectionType: string) => {
    if (!LIVE_PREVIEW_SECTION_TYPES.has(sectionType)) {
      pendingNonLiveRefreshRef.current = true;
    }
  }, []);

  const handleSectionPreviewChange = useCallback(
    (nextSection: StorefrontSection | null) => {
      if (!nextSection || selectedOutlineNode?.type !== 'section') return;
      setSectionOverride(selectedOutlineNode.id, nextSection);
    },
    [selectedOutlineNode, setSectionOverride],
  );

  const handleRegionPreviewChange = useCallback((nextDraft: RegionMap | null) => {
    setPreviewRegionOverrides(nextDraft);
  }, []);

  const setIsPreviewFrameLoaded = useCallback(() => {
    setFrameLoadedKey(stableKey);
  }, [stableKey]);

  return {
    previewFrameRef,
    isPreviewFrameLoaded,
    setIsPreviewFrameLoaded,
    previewSectionOverrides,
    previewRegionOverrides,
    inspectorSaveState,
    setInspectorSaveState,
    clearPreviewOverrides,
    setSectionOverride,
    scheduleNonLiveRefresh,
    handleSectionPreviewChange,
    handleRegionPreviewChange,
  };
}
