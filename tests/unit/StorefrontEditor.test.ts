import { describe, expect, it } from 'vitest';
import type { StorefrontPage } from '@/lib/types';
import {
  buildStorefrontEditorGroups,
  buildStorefrontPreviewUrl,
  getDefaultStorefrontEditorSelection,
  resolveStorefrontPreviewState,
} from '@/features/settings/lib/storefrontEditor';

const basePage: StorefrontPage = {
  id: 'page-home',
  path: '/',
  name: 'Home',
  kind: 'home',
  pageClass: 'system',
  isPublished: true,
  hasUnpublishedChanges: false,
  draft: {
    layout: [],
    seoTitle: null,
    seoDescription: null,
  },
  published: {
    layout: [],
    seoTitle: null,
    seoDescription: null,
  },
};

function buildPage(overrides: Partial<StorefrontPage>): StorefrontPage {
  return {
    ...basePage,
    ...overrides,
    draft: overrides.draft ?? basePage.draft,
    published: overrides.published ?? basePage.published,
  };
}

describe('storefront editor helpers', () => {
  it('builds grouped nodes for global, system, content, and capability pages', () => {
    const pages = [
      buildPage({ id: 'page-home', path: '/', name: 'Home', pageClass: 'system' }),
      buildPage({
        id: 'page-about',
        path: '/about',
        name: 'About',
        pageClass: 'content',
      }),
      buildPage({
        id: 'page-bookings',
        path: '/bookings',
        name: 'Bookings',
        pageClass: 'capability',
      }),
    ];

    const groups = buildStorefrontEditorGroups(pages);

    expect(groups[0].id).toBe('global');
    expect(groups[0].nodes).toHaveLength(5);
    expect(groups[1].nodes).toHaveLength(1);
    expect(groups[2].nodes).toHaveLength(1);
    expect(groups[3].nodes).toHaveLength(1);
  });

  it('defaults editor selection to the home page when available', () => {
    const selection = getDefaultStorefrontEditorSelection([
      buildPage({ id: 'page-about', path: '/about', name: 'About', pageClass: 'content' }),
      buildPage({ id: 'page-home', path: '/', name: 'Home', pageClass: 'system' }),
    ]);

    expect(selection).toEqual({ type: 'page', pageId: 'page-home' });
  });

  it('falls back preview to a live page when the selected page is draft only', () => {
    const pages = [
      buildPage({ id: 'page-home', path: '/', name: 'Home', pageClass: 'system' }),
      buildPage({
        id: 'page-about',
        path: '/about',
        name: 'About',
        pageClass: 'content',
        isPublished: false,
      }),
    ];

    const preview = resolveStorefrontPreviewState(
      { type: 'page', pageId: 'page-about' },
      pages,
    );

    expect(preview.path).toBe('/');
    expect(preview.reason).toMatch(/draft-only pages stay hidden/i);
  });

  it('builds preview urls from a configured storefront origin', () => {
    const result = buildStorefrontPreviewUrl({
      subdomain: 'minimal-demo',
      path: '/about',
      currentOrigin: 'http://localhost:3000',
      configuredOrigin: 'http://{subdomain}.localhost:3001',
    });

    expect(result.url).toBe('http://minimal-demo.localhost:3001/about');
    expect(result.note).toBeNull();
  });

  it('falls back to localhost preview hosts when no explicit origin is configured', () => {
    const result = buildStorefrontPreviewUrl({
      subdomain: 'minimal-demo',
      path: '/products',
      currentOrigin: 'http://localhost:3000',
    });

    expect(result.url).toBe('http://minimal-demo.localhost:3000/products');
    expect(result.note).toMatch(/NEXT_PUBLIC_STOREFRONT_EDITOR_ORIGIN/i);
  });
});
