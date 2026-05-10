import { describe, expect, it } from 'vitest';
import type { RegionMap, StorefrontPage } from '@/lib/types';
import {
  buildSiteEditorNavigatorPages,
  buildSiteEditorOutlineGroups,
  buildSiteEditorPageGroups,
  buildSiteEditorSiteWideNodes,
  getSelectedSiteEditorSection,
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

  it('builds a plain navigator page list in page order', () => {
    const pages = buildSiteEditorNavigatorPages([
      buildPage({ id: 'page-home', path: '/', name: 'Home' }),
      buildPage({ id: 'page-about', path: '/about', name: 'About', pageClass: 'content' }),
    ]);

    expect(pages.map((page) => page.label)).toEqual(['Home', 'About']);
    expect(pages[0]?.sections).toEqual([]);
    expect(pages[1]?.path).toBe('/about');
  });

  it('builds compact shared entries for shared editing areas', () => {
    const nodes = buildSiteEditorSiteWideNodes({
      announcement: {
        key: 'announcement',
        blocks: [{ id: 'announcement-message', type: 'announcement.message', data: { text: 'Hi' } }],
      },
      header: {
        key: 'header',
        blocks: [{ id: 'header-navigation', type: 'header.navigation', data: { links: [] } }],
      },
      footer: {
        key: 'footer',
        blocks: [{ id: 'footer-newsletter', type: 'footer.newsletter', data: { heading: 'Stay', body: 'Latest' } }],
      },
    });

    expect(nodes.map((node) => node.label)).toEqual([
      'Announcement Bar',
      'Navigation',
      'Footer',
    ]);
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
    expect(groups[0].nodes[0]).toMatchObject({
      type: 'shared',
      regionKey: 'announcement',
    });
    expect(groups[0].nodes[1]).toMatchObject({
      type: 'shared',
      regionKey: 'header',
    });
    expect(groups[1].id).toBe('template');
    expect(groups[1].nodes.map((node) => node.label)).toEqual(['Hero', 'Section']);
    expect(groups[1].nodes[1]?.meta).toBe('Hidden');
    expect(groups[2].id).toBe('footer');
    expect(groups[2].nodes.map((node) => node.label)).toEqual(['Footer']);
    expect(groups[2].nodes[0]).toMatchObject({
      type: 'shared',
      regionKey: 'footer',
    });
  });

  it('resolves a selected section back to its page layout entry', () => {
    const page = buildPage({
      draft: {
        layout: [
          { id: 'hero', type: 'hero.basic', visible: true, variantKey: 'split', data: {} },
          { id: 'categories', type: 'commerce.categoryGrid', visible: true, data: {} },
        ],
        seoTitle: null,
        seoDescription: null,
      },
    });

    const groups = buildSiteEditorOutlineGroups(page, {});
    const heroNode = groups[1].nodes[0] ?? null;

    expect(heroNode?.label).toBe('Hero');
    expect(getSelectedSiteEditorSection(page, heroNode)).toMatchObject({
      index: 0,
      section: page.draft.layout[0],
    });
  });
});
