import type {
  RegionKey,
  RegionBlock,
  RegionMap,
  StorefrontPage,
  StorefrontSection,
} from '@/lib/types';
import { getStorefrontPageLabel } from '@/features/settings/lib/storefrontEditor';

export type SiteEditorPanelKey = 'pages' | 'outline' | 'blocks' | 'theme';

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

export type SiteEditorOutlineGroup = {
  id: 'header' | 'template' | 'footer';
  label: string;
  shared: boolean;
  description: string;
  nodes: SiteEditorOutlineNode[];
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

function sharedNodeLabel(block: RegionBlock): string {
  switch (block.type) {
    case 'announcement.message':
      return 'Announcement Bar';
    case 'header.navigation':
      return 'Navigation';
    case 'footer.newsletter':
      return 'Newsletter';
    case 'footer.brand':
      return 'Brand';
    case 'footer.linkGroup':
      return block.data.heading?.trim() || 'Link Group';
    case 'legal.footer':
      return 'Legal Footer';
    case 'comingSoon.message':
      return 'Coming Soon';
  }
}

function toSharedOutlineNode(
  block: RegionBlock,
  regionKey: RegionKey,
): SiteEditorOutlineNode {
  return {
    id: `shared:${block.id}`,
    label: sharedNodeLabel(block),
    type: 'shared',
    sourceKey: block.id,
    regionKey,
    meta: sharedNodeMeta(block),
  };
}

function sectionNodeLabel(section: StorefrontSection, index: number): string {
  const rawType = section.type || 'section';
  const normalized = rawType
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return section.id ? normalized : `${normalized} ${index + 1}`;
}

function sharedNodeMeta(block: RegionBlock): string | null {
  if (block.visible === false) {
    return 'Hidden';
  }

  switch (block.type) {
    case 'footer.linkGroup':
      return `${block.data.links.length} links`;
    case 'header.navigation':
      return `${block.data.links.length} links`;
    default:
      return null;
  }
}

function sectionNodeMeta(section: StorefrontSection): string | null {
  if (section.visible === false) {
    return 'Hidden';
  }

  if (section.variantKey) {
    return section.variantKey;
  }

  return null;
}

export function buildSiteEditorOutlineGroups(
  page: StorefrontPage | null,
  regionsDraft: RegionMap | null,
): SiteEditorOutlineGroup[] {
  const draft = regionsDraft ?? {};
  const headerNodes = [
    ...(draft.announcement?.blocks ?? []).map((block) =>
      toSharedOutlineNode(block, 'announcement'),
    ),
    ...(draft.header?.blocks ?? []).map((block) =>
      toSharedOutlineNode(block, 'header'),
    ),
  ];

  const footerNodes = [
    ...(draft.footer?.blocks ?? []).map((block) =>
      toSharedOutlineNode(block, 'footer'),
    ),
    ...(draft.legalFooter?.blocks ?? []).map((block) =>
      toSharedOutlineNode(block, 'legalFooter'),
    ),
  ];

  const templateNodes = (page?.draft.layout ?? []).map<SiteEditorOutlineNode>(
    (section, index) => ({
      id: section.id ? `section:${section.id}` : `section:${index}`,
      label: sectionNodeLabel(section, index),
      type: 'section',
      sourceKey: section.id ?? `${index}`,
      meta: sectionNodeMeta(section),
    }),
  );

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
