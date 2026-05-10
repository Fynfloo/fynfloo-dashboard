import { render, screen, waitFor } from '@testing-library/react';
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
    layout: [
      {
        id: 'hero',
        type: 'hero.basic',
        visible: true,
        variantKey: 'split',
        data: {
          variant: 'split',
          title: 'Summer essentials',
          subtitle: 'Everything you need for the new season.',
        },
      },
    ],
    seoTitle: null,
    seoDescription: null,
  },
  published: {
    layout: [
      {
        id: 'hero',
        type: 'hero.basic',
        visible: true,
        variantKey: 'split',
        data: {
          variant: 'split',
          title: 'Summer essentials',
          subtitle: 'Everything you need for the new season.',
        },
      },
    ],
    seoTitle: null,
    seoDescription: null,
  },
};

const mockAboutPage: StorefrontPage = {
  id: 'page-about',
  path: '/about',
  name: 'About',
  kind: 'content',
  pageClass: 'content',
  isPublished: true,
  hasUnpublishedChanges: false,
  draft: {
    layout: [
      {
        id: 'about-story',
        type: 'content.textWithMedia',
        visible: true,
        data: {
          title: 'Our story',
          body: 'Built for thoughtful brands.',
          imageUrl: null,
          imageAlt: null,
          imagePosition: 'right',
        },
      },
    ],
    seoTitle: null,
    seoDescription: null,
  },
  published: {
    layout: [
      {
        id: 'about-story',
        type: 'content.textWithMedia',
        visible: true,
        data: {
          title: 'Our story',
          body: 'Built for thoughtful brands.',
          imageUrl: null,
          imageAlt: null,
          imagePosition: 'right',
        },
      },
    ],
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

const { apiRequestMock, saveDraftMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  saveDraftMock: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiRequest: apiRequestMock,
}));

vi.mock('@/features/settings/hooks/useStorefrontPages', () => ({
  useStorefrontPages: () => ({
    pages: [mockPage, mockAboutPage],
    isLoading: false,
    isCreating: false,
    isSaving: false,
    isPublishing: false,
    isDiscarding: false,
    error: null,
    createPage: vi.fn(),
    saveDraft: saveDraftMock,
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

function buildPreviewSession() {
  return {
    token: 'preview-token',
    slug: 'test-store',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
}

describe('SiteEditorWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequestMock.mockResolvedValue(buildPreviewSession());
    saveDraftMock.mockResolvedValue(mockPage);
  });

  it('opens the secondary panel as an overlay and allows pinning and closing it', async () => {
    const user = userEvent.setup();

    render(<SiteEditorWorkspace />);

    expect(screen.getByLabelText('Pages panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pin panel' })).toBeInTheDocument();
    expect(screen.getByText('Site view')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse Home' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse Home' }));

    expect(screen.queryByRole('treeitem', { name: 'Hero Split' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pin panel' }));

    expect(screen.getByRole('button', { name: 'Unpin panel' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close panel' }));

    expect(screen.queryByLabelText('Pages panel')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pages' }));

    expect(screen.getByLabelText('Pages panel')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Choose a page and open the parts you want to edit.',
      ),
    ).toBeInTheDocument();
  });

  it('opens the real region inspector when a shared item is selected', async () => {
    const user = userEvent.setup();

    render(<SiteEditorWorkspace />);

    await user.click(screen.getByRole('button', { name: 'Shared' }));
    await user.click(screen.getByRole('button', { name: 'Announcement Bar' }));

    expect(screen.getByRole('heading', { name: 'Announcement Bar' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Short promo text shown at the very top of your site. Changes made here carry through your site anywhere this area appears.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeInTheDocument();
  });

  it('opens a real section inspector when a page section is selected', async () => {
    const user = userEvent.setup();

    render(<SiteEditorWorkspace />);

    await user.click(screen.getByRole('treeitem', { name: 'Hero Split' }));

    expect(screen.getByRole('heading', { name: 'Hero' })).toBeInTheDocument();
    expect(
      screen.getByText('Update the content and settings for this part of the page.'),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('Summer essentials')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('saves a new hero layout from the blocks view', async () => {
    const user = userEvent.setup();

    render(<SiteEditorWorkspace />);

    await user.click(screen.getByRole('treeitem', { name: 'Hero Split' }));
    await user.click(screen.getByRole('button', { name: 'Blocks' }));
    await user.click(screen.getByRole('button', { name: 'Use Full-bleed hero' }));

    await waitFor(() => {
      expect(saveDraftMock).toHaveBeenCalledWith('page-home', {
        layout: [
          {
            id: 'hero',
            type: 'hero.basic',
            visible: true,
            variantKey: 'fullbleed',
            data: {
              variant: 'fullbleed',
              title: 'Summer essentials',
              subtitle: 'Everything you need for the new season.',
              eyebrow: undefined,
              imageUrl: undefined,
              primaryCtaLabel: undefined,
              secondaryCtaLabel: undefined,
            },
          },
        ],
      });
    });
  });

  it('warns before switching pages when there are unsaved edits', async () => {
    const user = userEvent.setup();

    render(<SiteEditorWorkspace />);

    await user.click(screen.getByRole('treeitem', { name: 'Hero Split' }));
    const titleInput = screen.getByDisplayValue('Summer essentials');
    await user.clear(titleInput);
    await user.type(titleInput, 'Fresh arrivals');
    await user.click(screen.getByRole('button', { name: 'About /about' }));

    expect(screen.getByRole('heading', { name: 'Unsaved changes' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Leave without saving' }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('/about')).toBeInTheDocument();
    });
  });

  it('boots the iframe through the storefront preview route once the preview session loads', async () => {
    render(<SiteEditorWorkspace />);

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        '/api/tenant/store-123/settings/storefront/preview-session',
        { method: 'POST' },
      );
    });

    await waitFor(() => {
      const frame = screen.getByTitle('Site editor preview');
      expect(frame).toHaveAttribute(
        'src',
        'http://test-store.localhost:3000/api/storefront/preview?token=preview-token&path=%2F',
      );
    });
  });
});
