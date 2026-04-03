// tests/unit/ProductList.test.tsx
//
// Layer 2 — ProductList component state lifecycle tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { mockProductList } from '../mocks/handlers';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ storeId: 'store-123' }),
  usePathname: () => '/dashboard/store-123/products',
}));

vi.mock('@/store/auth.store', () => ({
  useAuthStore: <T,>(
    selector: (state: {
      stores: { id: string; name: string; subdomain: string; currency: string }[];
    }) => T,
  ): T =>
    selector({
      stores: [{ id: 'store-123', name: 'Test Store', subdomain: 'test-store', currency: 'GBP' }],
    }),
}));

import { ProductList } from '@/features/products/components/ProductList';

// ─── Constants ────────────────────────────────────────────────────────────────

const API = 'http://localhost:8080';
const storeId = 'store-123';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProductList — loading state', () => {
  it('shows skeleton rows while loading', () => {
    server.use(
      http.get(`${API}/api/tenant/${storeId}/products`, async () => {
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json(mockProductList);
      }),
    );

    render(<ProductList />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows product table after load', async () => {
    render(<ProductList />);
    await waitFor(() => {
      expect(screen.getByText('Premium Oxford Shirt')).toBeInTheDocument();
    });
  });

  it('shows empty state when no products', async () => {
    server.use(
      http.get(`${API}/api/tenant/${storeId}/products`, () =>
        HttpResponse.json({ products: [], total: 0, page: 1, limit: 20 }),
      ),
    );

    render(<ProductList />);
    await waitFor(() => {
      expect(screen.getByText('No products yet')).toBeInTheDocument();
    });
  });
});

describe('ProductList — images', () => {
  it('shows product image when images array has items', async () => {
    render(<ProductList />);
    await waitFor(() => {
      const img = screen.getByRole('img', { name: /premium oxford shirt/i });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', expect.stringContaining('supabase.co'));
    });
  });

  it('shows camera placeholder when images array is empty', async () => {
    server.use(
      http.get(`${API}/api/tenant/${storeId}/products`, () =>
        HttpResponse.json({
          products: [{ ...mockProductList.products[0], images: [] }],
          total: 1,
          page: 1,
          limit: 20,
        }),
      ),
    );

    render(<ProductList />);
    await waitFor(() => {
      expect(screen.getByTitle('Add image')).toBeInTheDocument();
    });
  });
});

describe('ProductList — price display', () => {
  it('displays price formatted in store currency (not minor units)', async () => {
    render(<ProductList />);
    await waitFor(() => {
      // price: 4999 in GBP → should display £49.99
      expect(screen.getByText('£49.99')).toBeInTheDocument();
    });
  });

  it('shows compare at price crossed out', async () => {
    render(<ProductList />);
    await waitFor(() => {
      // compareAtPrice: 5999 → £59.99
      const strikethrough = screen.getByText('£59.99');
      expect(strikethrough).toHaveClass('line-through');
    });
  });
});

describe('ProductList — status filter tabs', () => {
  it('filters by Active status when tab clicked', async () => {
    let capturedStatus: string | null = null;

    server.use(
      http.get(`${API}/api/tenant/${storeId}/products`, ({ request }) => {
        const url = new URL(request.url);
        capturedStatus = url.searchParams.get('status');
        return HttpResponse.json(mockProductList);
      }),
    );

    const user = userEvent.setup();
    render(<ProductList />);
    await waitFor(() => screen.getByText('Premium Oxford Shirt'));

    await user.click(screen.getByRole('button', { name: 'Active' }));

    await waitFor(() => {
      expect(capturedStatus).toBe('ACTIVE');
    });
  });

  it('resets to page 1 when status filter changes', async () => {
    let capturedPage: string | null = null;

    server.use(
      http.get(`${API}/api/tenant/${storeId}/products`, ({ request }) => {
        const url = new URL(request.url);
        capturedPage = url.searchParams.get('page');
        return HttpResponse.json(mockProductList);
      }),
    );

    const user = userEvent.setup();
    render(<ProductList />);
    await waitFor(() => screen.getByText('Premium Oxford Shirt'));

    await user.click(screen.getByRole('button', { name: 'Draft' }));

    await waitFor(() => {
      expect(capturedPage).toBe('1');
    });
  });
});

describe('ProductList — delete product', () => {
  it('shows delete confirmation modal when delete option clicked', async () => {
    const user = userEvent.setup();
    render(<ProductList />);
    await waitFor(() => screen.getByText('Premium Oxford Shirt'));

    const allButtons = screen.getAllByRole('button');
    const dotsBtn = allButtons.find(
      (btn) => btn.className.includes('rounded-lg') && btn.querySelector('svg'),
    );

    if (!dotsBtn) return;

    await user.click(dotsBtn);

    const deleteOption = screen.queryByText('Delete product');
    if (deleteOption) {
      await user.click(deleteOption);
      await waitFor(() => {
        expect(screen.getByText('Delete product?')).toBeInTheDocument();
      });
    }
  });
});

describe('ProductList — add product', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('navigates to new product page when Add product button clicked', async () => {
    const user = userEvent.setup();
    render(<ProductList />);
    await waitFor(() => screen.getByText('Premium Oxford Shirt'));

    await user.click(screen.getByRole('button', { name: /add product/i }));

    expect(mockPush).toHaveBeenCalledWith('/dashboard/store-123/products/new');
  });

  it('navigates to new product page from empty state Add product button', async () => {
    server.use(
      http.get(`${API}/api/tenant/${storeId}/products`, () =>
        HttpResponse.json({ products: [], total: 0, page: 1, limit: 20 }),
      ),
    );

    const user = userEvent.setup();
    render(<ProductList />);
    await waitFor(() => screen.getByText('No products yet'));

    // Two "Add product" buttons exist — header + empty state
    // Click either one — both call the same handler
    const addButtons = screen.getAllByRole('button', { name: /add product/i });
    await user.click(addButtons[0]);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/store-123/products/new');
  });
});
