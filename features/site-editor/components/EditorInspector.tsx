'use client';

import type { DiscardStorefrontPageDraftResult, RegionKey, RegionMap, StorefrontSection, StorefrontPage } from '@/lib/types';
import { StorefrontPageInspector } from '@/features/settings/components/StorefrontPageInspector';
import { StorefrontRegionInspector } from '@/features/settings/components/StorefrontRegionInspector';
import type { useStorefrontPages } from '@/features/settings/hooks/useStorefrontPages';
import type { useStorefrontRegions } from '@/features/settings/hooks/useStorefrontRegions';
import type { SiteEditorOutlineNode } from '../lib/siteEditor';
import type { SiteEditorSaveState } from '../lib/useSiteEditorDraftSession';
import { StorefrontSectionInspector } from './StorefrontSectionInspector';

export function EditorInspector({
  selectedSharedRegionKey,
  selectedSection,
  selectedOutlineNode,
  selectedPage,
  regionState,
  pageState,
  onSectionSaveDraft,
  onPagePublish,
  onPageDiscard,
  onRegionPublish,
  onRegionDiscard,
  onDirtyChange,
  onSaveStateChange,
  onSectionPreviewChange,
  onRegionPreviewChange,
}: {
  selectedSharedRegionKey: RegionKey | null;
  selectedSection: StorefrontSection | null;
  selectedOutlineNode: SiteEditorOutlineNode | null;
  selectedPage: StorefrontPage | null;
  regionState: ReturnType<typeof useStorefrontRegions>;
  pageState: ReturnType<typeof useStorefrontPages>;
  onSectionSaveDraft: (section: StorefrontSection) => Promise<boolean>;
  onPagePublish: (pageId: string) => Promise<StorefrontPage | null>;
  onPageDiscard: (pageId: string) => Promise<DiscardStorefrontPageDraftResult | null>;
  onRegionPublish: () => Promise<boolean>;
  onRegionDiscard: () => Promise<boolean>;
  onDirtyChange: (dirty: boolean) => void;
  onSaveStateChange: (state: SiteEditorSaveState) => void;
  onSectionPreviewChange: (section: StorefrontSection | null) => void;
  onRegionPreviewChange: (map: RegionMap | null) => void;
}) {
  if (selectedSharedRegionKey) {
    return (
      <StorefrontRegionInspector
        key={selectedSharedRegionKey}
        regionKey={selectedSharedRegionKey}
        regions={regionState.regions}
        isLoading={regionState.isLoading}
        isPublishing={regionState.isPublishing}
        isDiscarding={regionState.isDiscarding}
        error={regionState.error}
        saveDraft={regionState.saveDraft}
        publish={onRegionPublish}
        discard={onRegionDiscard}
        onDirtyChange={onDirtyChange}
        onPreviewChange={onRegionPreviewChange}
        onSaveStateChange={onSaveStateChange}
      />
    );
  }

  if (selectedSection) {
    return (
      <StorefrontSectionInspector
        key={selectedOutlineNode?.id ?? 'section'}
        section={selectedSection}
        sectionLabel={selectedOutlineNode?.label ?? 'Section'}
        error={pageState.error}
        saveDraft={onSectionSaveDraft}
        onDirtyChange={onDirtyChange}
        onPreviewChange={onSectionPreviewChange}
        onSaveStateChange={onSaveStateChange}
      />
    );
  }

  return (
    <StorefrontPageInspector
      key={selectedPage?.id ?? 'page'}
      page={selectedPage}
      isLoading={pageState.isLoading}
      isPublishing={pageState.isPublishing}
      isDiscarding={pageState.isDiscarding}
      error={pageState.error}
      saveDraft={pageState.saveDraft}
      publish={onPagePublish}
      discard={onPageDiscard}
      onDirtyChange={onDirtyChange}
      onSaveStateChange={onSaveStateChange}
    />
  );
}
