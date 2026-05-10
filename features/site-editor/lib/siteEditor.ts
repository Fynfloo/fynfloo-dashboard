import type {
  RegionKey,
  RegionBlock,
  RegionMap,
  StorefrontPage,
  StorefrontSection,
} from '@/lib/types';
import { getStorefrontPageLabel } from '@/features/settings/lib/storefrontEditor';

export type SiteEditorPanelKey = 'navigator' | 'siteWide' | 'blocks' | 'theme';

export type SiteEditorPageNode = {
  id: string;
  label: string;
  path: string;
  pageId: string;
  pageClass: string;
  kind: string;
  isPublished: boolean;
  hasUnpublishedChanges: boolean;
};

export type SiteEditorPageGroup = {
  id: 'system' | 'content' | 'capability';
  label: string;
  description: string;
  nodes: SiteEditorPageNode[];
};

export type SiteEditorOutlineNode =
  | {
      id: string;
      label: string;
      type: 'shared';
      sourceKey: string;
      regionKey: RegionKey;
      meta: string | null;
    }
  | {
      id: string;
      label: string;
      type: 'section';
      sourceKey: string;
      meta: string | null;
    };

export type SiteEditorSectionSelection = {
  index: number;
  section: StorefrontSection;
};

export type SiteEditorOutlineGroup = {
  id: 'header' | 'template' | 'footer';
  label: string;
  shared: boolean;
  description: string;
  nodes: SiteEditorOutlineNode[];
};

export type SiteEditorNavigatorPageNode = SiteEditorPageNode & {
  type: 'page';
  sections: Extract<SiteEditorOutlineNode, { type: 'section' }>[];
};

export type SiteEditorNavigatorSharedNode = Extract<
  SiteEditorOutlineNode,
  { type: 'shared' }
>;

export type SiteEditorNavigatorGroup = {
  id: 'shared' | 'system' | 'content' | 'capability';
  label: string;
  description: string;
  nodes: Array<SiteEditorNavigatorSharedNode | SiteEditorNavigatorPageNode>;
};

function toPageNode(page: StorefrontPage): SiteEditorPageNode {
  return {
    id: `page:${page.id}`,
    label: getStorefrontPageLabel(page),
    path: page.path,
    pageId: page.id,
    pageClass: page.pageClass,
    kind: page.kind,
    isPublished: page.isPublished,
    hasUnpublishedChanges: page.hasUnpublishedChanges,
  };
}

export function buildSiteEditorPageGroups(
  pages: StorefrontPage[],
): SiteEditorPageGroup[] {
  const pageNodes = pages.map(toPageNode);

  return [
    {
      id: 'system',
      label: 'Core Pages',
      description: 'Key pages that come with your current site setup.',
      nodes: pageNodes.filter((page) => page.pageClass === 'system'),
    },
    {
      id: 'content',
      label: 'Custom Pages',
      description: 'Pages like About, Contact, and FAQ.',
      nodes: pageNodes.filter((page) => page.pageClass === 'content'),
    },
    {
      id: 'capability',
      label: 'Feature Pages',
      description: 'Pages unlocked by extra features such as bookings or tickets.',
      nodes: pageNodes.filter((page) => page.pageClass === 'capability'),
    },
  ];
}

function buildPageSectionNodes(
  page: StorefrontPage,
): Extract<SiteEditorOutlineNode, { type: 'section' }>[] {
  return (page.draft.layout ?? []).map((section, index) => ({
    id: section.id ? `section:${section.id}` : `section:${index}`,
    label: sectionNodeLabel(section, index),
    type: 'section',
    sourceKey: section.id ?? `${index}`,
    meta: sectionNodeMeta(section),
  }));
}

function toNavigatorPageNode(page: StorefrontPage): SiteEditorNavigatorPageNode {
  return {
    ...toPageNode(page),
    type: 'page',
    sections: buildPageSectionNodes(page),
  };
}

export function buildSiteEditorNavigatorPages(
  pages: StorefrontPage[],
): SiteEditorNavigatorPageNode[] {
  return pages.map(toNavigatorPageNode);
}

function sharedNodeLabel(regionKey: RegionKey): string {
  switch (regionKey) {
    case 'announcement':
      return 'Announcement Bar';
    case 'header':
      return 'Navigation';
    case 'footer':
      return 'Footer';
    case 'legalFooter':
      return 'Legal Footer';
    case 'comingSoon':
      return 'Coming Soon';
  }
}

function sharedNodeMeta(blocks: RegionBlock[]): string | null {
  if (blocks.length === 0) {
    return null;
  }

  const visibleBlocks = blocks.filter((block) => block.visible !== false);
  if (visibleBlocks.length === 0) {
    return 'Hidden';
  }

  return null;
}

function toSharedOutlineNode(
  regionKey: RegionKey,
  blocks: RegionBlock[],
): SiteEditorNavigatorSharedNode {
  return {
    id: `shared:${regionKey}`,
    label: sharedNodeLabel(regionKey),
    type: 'shared',
    sourceKey: regionKey,
    regionKey,
    meta: sharedNodeMeta(blocks),
  };
}

const SECTION_LABELS: Record<string, string> = {
  'hero.basic': 'Hero',
  'commerce.categoryGrid': 'Categories',
  'commerce.featuredCarousel': 'Featured products',
  'commerce.productGrid': 'Product grid',
  'commerce.productHero': 'Product details',
  'commerce.productSpecs': 'Product details',
  'commerce.relatedProducts': 'Related products',
  'content.textWithMedia': 'Text with image',
  'content.testimonials': 'Testimonials',
  'checkout.cartItems': 'Cart items',
  'checkout.cartSummary': 'Order summary',
};

function sectionNodeLabel(section: StorefrontSection, index: number): string {
  const label = SECTION_LABELS[section.type] ?? 'Section';
  return section.id ? label : `${label} ${index + 1}`;
}

function sectionNodeMeta(section: StorefrontSection): string | null {
  if (section.visible === false) {
    return 'Hidden';
  }

  if (section.type === 'hero.basic') {
    return section.variantKey === 'fullbleed' ? 'Full-bleed' : 'Split';
  }

  if (section.type === 'content.textWithMedia') {
    const imagePosition =
      typeof section.data.imagePosition === 'string' ? section.data.imagePosition : null;

    if (imagePosition === 'left') {
      return 'Image left';
    }

    if (imagePosition === 'right') {
      return 'Image right';
    }
  }

  if (section.type === 'commerce.productGrid') {
    const columns =
      typeof section.data.columns === 'number' && Number.isFinite(section.data.columns)
        ? section.data.columns
        : null;

    if (columns) {
      return `${columns} columns`;
    }
  }

  if (section.variantKey) {
    return section.variantKey;
  }

  return null;
}

export function getSelectedSiteEditorSection(
  page: StorefrontPage | null,
  node: SiteEditorOutlineNode | null,
): SiteEditorSectionSelection | null {
  if (!page || !node || node.type !== 'section') {
    return null;
  }

  const byIdIndex = page.draft.layout.findIndex(
    (section) => section.id && section.id === node.sourceKey,
  );

  if (byIdIndex >= 0) {
    return {
      index: byIdIndex,
      section: page.draft.layout[byIdIndex],
    };
  }

  const numericIndex = Number.parseInt(node.sourceKey, 10);
  if (!Number.isNaN(numericIndex) && page.draft.layout[numericIndex]) {
    return {
      index: numericIndex,
      section: page.draft.layout[numericIndex],
    };
  }

  return null;
}

export function buildSiteEditorOutlineGroups(
  page: StorefrontPage | null,
  regionsDraft: RegionMap | null,
): SiteEditorOutlineGroup[] {
  const draft = regionsDraft ?? {};
  const headerNodes = [
    ...(draft.announcement ? [toSharedOutlineNode('announcement', draft.announcement.blocks)] : []),
    ...(draft.header ? [toSharedOutlineNode('header', draft.header.blocks)] : []),
  ];

  const footerNodes = [
    ...(draft.footer ? [toSharedOutlineNode('footer', draft.footer.blocks)] : []),
  ];

  const templateNodes = page ? buildPageSectionNodes(page) : [];

  return [
    {
      id: 'header',
      label: 'Header',
      shared: true,
      description: 'Shared site content that appears across your pages.',
      nodes: headerNodes,
    },
    {
      id: 'template',
      label: 'Page',
      shared: false,
      description: page
        ? `${getStorefrontPageLabel(page)} page structure`
        : 'Select a page to inspect its structure.',
      nodes: templateNodes,
    },
    {
      id: 'footer',
      label: 'Footer',
      shared: true,
      description: 'Shared footer content shown anywhere your footer appears.',
      nodes: footerNodes,
    },
  ];
}

export function buildSiteEditorNavigatorGroups(
  pages: StorefrontPage[],
  regionsDraft: RegionMap | null,
): SiteEditorNavigatorGroup[] {
  const draft = regionsDraft ?? {};
  const sharedNodes: SiteEditorNavigatorSharedNode[] = [
    ...(draft.announcement ? [toSharedOutlineNode('announcement', draft.announcement.blocks)] : []),
    ...(draft.header ? [toSharedOutlineNode('header', draft.header.blocks)] : []),
    ...(draft.footer ? [toSharedOutlineNode('footer', draft.footer.blocks)] : []),
    ...(draft.comingSoon ? [toSharedOutlineNode('comingSoon', draft.comingSoon.blocks)] : []),
  ];

  const pageNodes = pages.map(toNavigatorPageNode);

  return [
    {
      id: 'system',
      label: 'Core Pages',
      description: 'Key pages that come with your current site setup.',
      nodes: pageNodes.filter((page) => page.pageClass === 'system'),
    },
    {
      id: 'content',
      label: 'Custom Pages',
      description: 'Pages like About, Contact, and FAQ.',
      nodes: pageNodes.filter((page) => page.pageClass === 'content'),
    },
    {
      id: 'capability',
      label: 'Feature Pages',
      description: 'Pages unlocked by extra features such as bookings or tickets.',
      nodes: pageNodes.filter((page) => page.pageClass === 'capability'),
    },
    {
      id: 'shared',
      label: 'Shared',
      description: 'Areas that can appear across multiple pages.',
      nodes: sharedNodes,
    },
  ];
}

export function buildSiteEditorSiteWideNodes(
  regionsDraft: RegionMap | null,
): SiteEditorNavigatorSharedNode[] {
  const draft = regionsDraft ?? {};

  return [
    ...(draft.announcement ? [toSharedOutlineNode('announcement', draft.announcement.blocks)] : []),
    ...(draft.header ? [toSharedOutlineNode('header', draft.header.blocks)] : []),
    ...(draft.footer ? [toSharedOutlineNode('footer', draft.footer.blocks)] : []),
    ...(draft.comingSoon ? [toSharedOutlineNode('comingSoon', draft.comingSoon.blocks)] : []),
  ];
}
