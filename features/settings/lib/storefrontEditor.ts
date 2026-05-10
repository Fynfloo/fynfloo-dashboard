import type { RegionKey, StorefrontPage } from '@/lib/types';

export type StorefrontEditorSelection =
  | { type: 'region'; regionKey: RegionKey }
  | { type: 'page'; pageId: string };

export type StorefrontEditorNode =
  | {
      id: string;
      type: 'region';
      label: string;
      description: string;
      regionKey: RegionKey;
    }
  | {
      id: string;
      type: 'page';
      label: string;
      path: string;
      pageId: string;
      pageClass: string;
      kind: string;
      isPublished: boolean;
      hasUnpublishedChanges: boolean;
    };

export type StorefrontEditorGroup = {
  id: 'global' | 'system' | 'content' | 'capability';
  label: string;
  description: string;
  nodes: StorefrontEditorNode[];
};

export type StorefrontPreviewState = {
  path: string;
  title: string;
  reason: string | null;
  requiresPreviewToken: boolean;
};

const REGION_META: Array<{
  regionKey: RegionKey;
  label: string;
  description: string;
}> = [
  {
    regionKey: 'announcement',
    label: 'Announcement Bar',
    description: 'Top strip used for promotions and short notices.',
  },
  {
    regionKey: 'header',
    label: 'Header',
    description: 'Primary navigation and top-level storefront entry links.',
  },
  {
    regionKey: 'footer',
    label: 'Footer',
    description: 'Newsletter, footer brand story, and grouped footer links.',
  },
  {
    regionKey: 'legalFooter',
    label: 'Legal Footer',
    description: 'Bottom legal strip, provider labels, and copyright text.',
  },
  {
    regionKey: 'comingSoon',
    label: 'Coming Soon',
    description: 'Fallback launch page shown before a storefront goes live.',
  },
];

export function getStorefrontPageLabel(page: StorefrontPage): string {
  return page.name?.trim() || page.path;
}

export function buildStorefrontEditorGroups(pages: StorefrontPage[]): StorefrontEditorGroup[] {
  const pageNodes = pages.map<StorefrontEditorNode>((page) => ({
    id: `page:${page.id}`,
    type: 'page',
    label: getStorefrontPageLabel(page),
    path: page.path,
    pageId: page.id,
    pageClass: page.pageClass,
    kind: page.kind,
    isPublished: page.isPublished,
    hasUnpublishedChanges: page.hasUnpublishedChanges,
  }));

  return [
    {
      id: 'global',
      label: 'Global',
      description: 'Shared storefront shell and non-page regions.',
      nodes: REGION_META.map((entry) => ({
        id: `region:${entry.regionKey}`,
        type: 'region',
        label: entry.label,
        description: entry.description,
        regionKey: entry.regionKey,
      })),
    },
    {
      id: 'system',
      label: 'System Pages',
      description: 'Core routes that come from the active storefront capability set.',
      nodes: pageNodes.filter((page) => page.type === 'page' && page.pageClass === 'system'),
    },
    {
      id: 'content',
      label: 'Content Pages',
      description: 'Merchant-created content pages with their own path and draft state.',
      nodes: pageNodes.filter((page) => page.type === 'page' && page.pageClass === 'content'),
    },
    {
      id: 'capability',
      label: 'Capability Pages',
      description: 'Pages unlocked by future capability packs like bookings or tickets.',
      nodes: pageNodes.filter((page) => page.type === 'page' && page.pageClass === 'capability'),
    },
  ];
}

export function getDefaultStorefrontEditorSelection(
  pages: StorefrontPage[],
): StorefrontEditorSelection {
  const homePage = pages.find((page) => page.path === '/');
  if (homePage) {
    return { type: 'page', pageId: homePage.id };
  }

  if (pages[0]) {
    return { type: 'page', pageId: pages[0].id };
  }

  return { type: 'region', regionKey: 'header' };
}

function getPreferredPublishedPreviewPath(pages: StorefrontPage[]): string {
  const homePage = pages.find((page) => page.isPublished && page.path === '/');
  if (homePage) return homePage.path;

  const firstPublishedPage = pages.find((page) => page.isPublished);
  if (firstPublishedPage) return firstPublishedPage.path;

  return '/';
}

export function resolveStorefrontPreviewState(
  selection: StorefrontEditorSelection,
  pages: StorefrontPage[],
): StorefrontPreviewState {
  if (selection.type === 'page') {
    const page = pages.find((entry) => entry.id === selection.pageId);

    if (page) {
      return {
        path: page.path,
        title: getStorefrontPageLabel(page),
        reason: page.isPublished
          ? null
          : 'Draft-only pages stay hidden from public visitors. The editor uses a protected preview session to render this page safely before it is published.',
        requiresPreviewToken: !page.isPublished,
      };
    }
  }

  return {
    path: getPreferredPublishedPreviewPath(pages),
    title: 'Storefront shell',
    reason: null,
    requiresPreviewToken: false,
  };
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function joinOriginAndPath(origin: string, path: string): string {
  const normalizedOrigin = trimTrailingSlash(origin);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedOrigin}${normalizedPath}`;
}

type PreviewUrlOptions = {
  subdomain: string | null;
  path: string;
  currentOrigin: string | null;
  configuredOrigin?: string;
  previewToken?: string | null;
  requiresPreviewToken?: boolean;
};

export type StorefrontPreviewUrlResult = {
  url: string | null;
  note: string | null;
};

type StorefrontPreviewOriginResult = {
  origin: string | null;
  note: string | null;
};

function resolveStorefrontPreviewOrigin({
  subdomain,
  currentOrigin,
  configuredOrigin,
}: Omit<PreviewUrlOptions, 'path' | 'previewToken' | 'requiresPreviewToken'>): StorefrontPreviewOriginResult {
  if (!subdomain) {
    return {
      origin: null,
      note: 'Storefront preview becomes available after the store context loads.',
    };
  }

  if (configuredOrigin) {
    const resolvedOrigin = configuredOrigin.includes('{subdomain}')
      ? configuredOrigin.replaceAll('{subdomain}', subdomain)
      : configuredOrigin;

    return {
      origin: trimTrailingSlash(resolvedOrigin),
      note: null,
    };
  }

  if (!currentOrigin) {
    return {
      origin: null,
      note: 'Preparing storefront preview…',
    };
  }

  const origin = new URL(currentOrigin);
  const port = origin.port ? `:${origin.port}` : '';

  if (origin.hostname === 'app.fynfloo.com' || origin.hostname.endsWith('.fynfloo.com')) {
    return {
      origin: `https://${subdomain}.fynfloo.com`,
      note: null,
    };
  }

  if (origin.hostname === 'lvh.me' || origin.hostname.endsWith('.lvh.me')) {
    return {
      origin: `${origin.protocol}//${subdomain}.lvh.me${port}`,
      note: 'Using the local lvh.me preview host. Set NEXT_PUBLIC_STOREFRONT_EDITOR_ORIGIN if your storefront dev server uses a different port.',
    };
  }

  if (origin.hostname === 'localhost' || origin.hostname.endsWith('.localhost')) {
    return {
      origin: `${origin.protocol}//${subdomain}.localhost${port}`,
      note: 'Using the local *.localhost preview host. Set NEXT_PUBLIC_STOREFRONT_EDITOR_ORIGIN if your storefront dev server uses a different host or port.',
    };
  }

  return {
    origin: null,
    note: 'Set NEXT_PUBLIC_STOREFRONT_EDITOR_ORIGIN to enable iframe preview in this environment.',
  };
}

function buildPreviewBootstrapUrl(origin: string, token: string, path: string): string {
  const searchParams = new URLSearchParams({
    token,
    path: path.startsWith('/') ? path : `/${path}`,
  });

  return `${trimTrailingSlash(origin)}/api/storefront/preview?${searchParams.toString()}`;
}

export function buildStorefrontPreviewUrl({
  subdomain,
  path,
  currentOrigin,
  configuredOrigin,
  previewToken,
  requiresPreviewToken = false,
}: PreviewUrlOptions): StorefrontPreviewUrlResult {
  const resolved = resolveStorefrontPreviewOrigin({
    subdomain,
    currentOrigin,
    configuredOrigin,
  });

  if (!resolved.origin) {
    return {
      url: null,
      note: resolved.note,
    };
  }

  if (previewToken) {
    return {
      url: buildPreviewBootstrapUrl(resolved.origin, previewToken, path),
      note: resolved.note,
    };
  }

  if (requiresPreviewToken) {
    return {
      url: null,
      note: 'Preparing draft preview…',
    };
  }

  return {
    url: joinOriginAndPath(resolved.origin, path),
    note: resolved.note,
  };
}
