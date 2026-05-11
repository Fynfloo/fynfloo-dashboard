import { describe, expect, it, vi } from 'vitest';
import {
  postSiteEditorPreviewMessage,
  resolvePreviewMessageTargetOrigin,
} from '@/features/site-editor/lib/previewBridge';

describe('preview bridge helpers', () => {
  it('resolves the target origin from a preview URL', () => {
    expect(
      resolvePreviewMessageTargetOrigin(
        'http://test-store.localhost:3000/api/storefront/preview?token=abc&path=%2F',
      ),
    ).toBe('http://test-store.localhost:3000');
  });

  it('returns null when the preview URL is invalid', () => {
    expect(resolvePreviewMessageTargetOrigin('not-a-valid-url')).toBeNull();
    expect(resolvePreviewMessageTargetOrigin(null)).toBeNull();
  });

  it('posts a typed preview message when target and origin are available', () => {
    const postMessage = vi.fn();

    expect(
      postSiteEditorPreviewMessage(
        { postMessage } as unknown as Window,
        'http://test-store.localhost:3000',
        {
          source: 'fynfloo-site-editor',
          type: 'site-editor:select-node',
          nodeId: 'section:hero',
        },
      ),
    ).toBe(true);

    expect(postMessage).toHaveBeenCalledWith(
      {
        source: 'fynfloo-site-editor',
        type: 'site-editor:select-node',
        nodeId: 'section:hero',
      },
      'http://test-store.localhost:3000',
    );
  });

  it('does not post when the preview target is incomplete', () => {
    const postMessage = vi.fn();

    expect(
      postSiteEditorPreviewMessage(
        { postMessage } as unknown as Window,
        null,
        {
          source: 'fynfloo-site-editor',
          type: 'site-editor:select-node',
          nodeId: null,
        },
      ),
    ).toBe(false);

    expect(postMessage).not.toHaveBeenCalled();
  });
});

