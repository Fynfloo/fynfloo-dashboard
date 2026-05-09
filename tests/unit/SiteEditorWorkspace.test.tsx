import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RegionMap, StorefrontPage } from '@/lib/types';

const mockStore = {
  id: 'store-123',
  name: 'Test Store',
  subdomain: 'test-store',
  currency: 'GBP',
  stripeChargesEnabled: false,
};

const mockPage: StorefrontPage = {
  id: 'page-home',
  path: '/',
  name: 'Home',
  kind: 'home',
  pageClass: 'system',
  isPublished: true,
  hasUnpublishedChanges: false,
  draft: {
    layout: [{ id: 'hero', type: 'hero.basic', visible: true, data: {} }],
    seoTitle: null,
    seoDescription: null,
  },
  published: {
    layout: [{ id: 'hero', type: 'hero.basic', visible: true, data: {} }],
    seoTitle: null,
    seoDescription: null,
  },
};

const mockRegions: RegionMap = {
  announcement: {
    key: 'announcement',
    blocks: [
      {
        id: 'announcement-message',
        type: 'announcement.message',
        data: { text: 'New season drop' },
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
        data: { heading: 'Stay in the loop', body: 'Latest stories' },
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

vi.mock('@/hooks/useStore', () => ({
  useCurrentStore: () => mockStore,
}));

vi.mock('@/components/layout/UserMenu', () => ({
  UserMenu: () => <div>User menu</div>,
}));

vi.mock('@/features/settings/hooks/useStorefrontPages', () => ({
  useStorefrontPages: () => ({
    pages: [mockPage],
    isLoading: false,
    isCreating: false,
    isSaving: false,
    isPublishing: false,
    isDiscarding: false,
    error: null,
    createPage: vi.fn(),
    saveDraft: vi.fn(),
    publish: vi.fn(),
    discard: vi.fn(),
  }),
}));

vi.mock('@/features/settings/hooks/useStorefrontRegions', () => ({
  useStorefrontRegions: () => ({
    regions: {
      draft: mockRegions,
      published: mockRegions,
      hasUnpublishedChanges: false,
    },
    isLoading: false,
    isSaving: false,
    isPublishing: false,
    isDiscarding: false,
    error: null,
    saveDraft: vi.fn(),
    publish: vi.fn(),
    discard: vi.fn(),
  }),
}));

import { SiteEditorWorkspace } from '@/features/site-editor/components/SiteEditorWorkspace';

describe('SiteEditorWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens the secondary panel as an overlay and allows pinning and closing it', async () => {
    const user = userEvent.setup();

    render(<SiteEditorWorkspace />);

    expect(screen.getByLabelText('Pages panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pin panel' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pin panel' }));

    expect(screen.getByRole('button', { name: 'Unpin panel' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close panel' }));

    expect(screen.queryByLabelText('Pages panel')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Outline' }));

    expect(screen.getByLabelText('Outline panel')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Shared shell groups now sit around the current page structure instead of appearing as fake top-level pages.',
      ),
    ).toBeInTheDocument();
  });

  it('opens the real region inspector when a shared outline node is selected', async () => {
    const user = userEvent.setup();

    render(<SiteEditorWorkspace />);

    await user.click(screen.getByRole('button', { name: 'Outline' }));
    await user.click(screen.getByRole('button', { name: /Announcement Bar/ }));

    expect(screen.getByRole('heading', { name: 'Announcement Bar' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Short promo text shown at the very top of the storefront shell. Shell changes apply across the storefront, so they stay beside the preview instead of living in a separate settings form.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeInTheDocument();
  });
});
