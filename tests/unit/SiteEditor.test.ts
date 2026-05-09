import { describe, expect, it } from 'vitest';
import type { RegionMap, StorefrontPage } from '@/lib/types';
import {
  buildSiteEditorOutlineGroups,
  buildSiteEditorPageGroups,
} from '@/features/site-editor/lib/siteEditor';

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

describe('site editor helpers', () => {
  it('groups editable pages without exposing shared regions as top-level page entries', () => {
    const groups = buildSiteEditorPageGroups([
      buildPage({ id: 'page-home', path: '/', pageClass: 'system' }),
      buildPage({ id: 'page-about', path: '/about', pageClass: 'content', name: 'About' }),
      buildPage({
        id: 'page-bookings',
        path: '/bookings',
        pageClass: 'capability',
        name: 'Bookings',
      }),
    ]);

    expect(groups.map((group) => group.id)).toEqual(['system', 'content', 'capability']);
    expect(groups[0].nodes).toHaveLength(1);
    expect(groups[1].nodes).toHaveLength(1);
    expect(groups[2].nodes).toHaveLength(1);
  });

  it('builds header/template/footer outline groups from shared regions and page sections', () => {
    const page = buildPage({
      draft: {
        layout: [
          { id: 'hero', type: 'hero.basic', visible: true, variantKey: 'hero-minimal', data: {} },
          { id: 'cta', type: 'cta.banner', visible: false, data: {} },
        ],
        seoTitle: null,
        seoDescription: null,
      },
    });

    const regions: RegionMap = {
      announcement: {
        key: 'announcement',
        blocks: [
          {
            id: 'announcement-message',
            type: 'announcement.message',
            data: { text: 'New drop this week' },
          },
        ],
      },
      header: {
        key: 'header',
        blocks: [
          {
            id: 'header-navigation',
            type: 'header.navigation',
            data: { links: [] },
          },
        ],
      },
      footer: {
        key: 'footer',
        blocks: [
          {
            id: 'footer-newsletter',
            type: 'footer.newsletter',
            data: { heading: 'Stay in the loop', body: 'Latest news' },
          },
        ],
      },
      legalFooter: {
        key: 'legalFooter',
        blocks: [
          {
            id: 'legal-footer',
            type: 'legal.footer',
            data: { showPoweredBy: true },
          },
        ],
      },
    };

    const groups = buildSiteEditorOutlineGroups(page, regions);

    expect(groups[0].id).toBe('header');
    expect(groups[0].nodes.map((node) => node.label)).toEqual(['Announcement Bar', 'Navigation']);
    expect(groups[1].id).toBe('template');
    expect(groups[1].nodes.map((node) => node.label)).toEqual(['Hero Basic', 'Cta Banner']);
    expect(groups[1].nodes[1]?.meta).toBe('Hidden');
    expect(groups[2].id).toBe('footer');
    expect(groups[2].nodes.map((node) => node.label)).toEqual(['Newsletter', 'Legal Footer']);
  });
});
