import type { RegionMap, StorefrontSection } from '@/lib/types';

export const SITE_EDITOR_PREVIEW_SOURCE = 'fynfloo-site-editor';

export type SiteEditorPreviewMessage =
  | {
      source: typeof SITE_EDITOR_PREVIEW_SOURCE;
      type: 'site-editor:ready';
    }
  | {
      source: typeof SITE_EDITOR_PREVIEW_SOURCE;
      type: 'site-editor:select-node';
      nodeId: string | null;
    }
  | {
      source: typeof SITE_EDITOR_PREVIEW_SOURCE;
      type: 'site-editor:preview-section';
      nodeId: string;
      section: StorefrontSection | null;
    }
  | {
      source: typeof SITE_EDITOR_PREVIEW_SOURCE;
      type: 'site-editor:preview-regions';
      regions: RegionMap | null;
    }
  | {
      source: typeof SITE_EDITOR_PREVIEW_SOURCE;
      type: 'site-editor:node-click';
      nodeId: string;
    };

export function resolvePreviewMessageTargetOrigin(url: string | null): string | null {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function postSiteEditorPreviewMessage(
  target: Window | null,
  origin: string | null,
  message: SiteEditorPreviewMessage,
): boolean {
  if (!target || !origin) {
    return false;
  }

  target.postMessage(message, origin);
  return true;
}
