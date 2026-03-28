// tests/unit/ProductForm.test.tsx
//
// Layer 2 — Component state lifecycle tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { mockProduct } from '../mocks/handlers';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({ storeId: 'store-123', id: 'product-123' }),
  usePathname: () => '/dashboard/store-123/products/product-123',
}));

type AuthState = {
  user: { id: string; email: string; mfaEnabled: boolean };
  stores: { id: string; name: string; subdomain: string; currency: string }[];
};

vi.mock('@/store/auth.store', () => ({
  useAuthStore: <T,>(selector: (state: AuthState) => T): T =>
    selector({
      user: { id: 'user-1', email: 'test@test.com', mfaEnabled: false },
      stores: [{ id: 'store-123', name: 'Test Store', subdomain: 'test-store', currency: 'GBP' }],
    }),
}));

type ProductStoreState = {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
};

vi.mock('@/store/product.store', () => ({
  useProductStore: <T,>(selector: (state: ProductStoreState) => T): T =>
    selector({ isDirty: false, setDirty: vi.fn() }),
}));

import { ProductForm } from '@/features/products/components/ProductForm';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API = 'http://localhost:8080';
const storeId = 'store-123';
const productId = 'product-123';

async function waitForProductLoad() {
  await waitFor(
    () => {
      expect(screen.getByText('Premium Oxford Shirt')).toBeInTheDocument();
    },
    { timeout: 3000 },
  );
}

function renderProductForm() {
  return render(<ProductForm mode="edit" />);
}

// ─── dirty tracking ───────────────────────────────────────────────────────────

describe('ProductForm — dirty tracking', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('is NOT dirty immediately after load completes', async () => {
    renderProductForm();
    await waitForProductLoad();
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('becomes dirty only after user edits a field', async () => {
    const user = userEvent.setup();
    renderProductForm();
    await waitForProductLoad();

    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();

    const titleInput = screen.getByLabelText(/product name/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'New Title');

    await waitFor(() => {
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });
  });

  it('is NOT dirty after successful save', async () => {
    const user = userEvent.setup();
    renderProductForm();
    await waitForProductLoad();

    const titleInput = screen.getByLabelText(/product name/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Changed');

    await waitFor(() => {
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });
  });

  it('stays dirty if save fails', async () => {
    server.use(
      http.patch(`${API}/api/tenant/${storeId}/products/${productId}`, () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 }),
      ),
    );

    const user = userEvent.setup();
    renderProductForm();
    await waitForProductLoad();

    const titleInput = screen.getByLabelText(/product name/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Changed');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });
  });
});

// ─── status field ─────────────────────────────────────────────────────────────

describe('ProductForm — status field', () => {
  it('shows the correct status loaded from API', async () => {
    renderProductForm();
    await waitForProductLoad();
    const activeBtn = screen.getByRole('button', { name: /^active/i });
    expect(activeBtn).toHaveStyle({ background: 'var(--accent-dim)' });
  });

  it('sends the selected status on save — not the initial value', async () => {
    let capturedPayload: Record<string, unknown> | null = null;

    server.use(
      http.patch(`${API}/api/tenant/${storeId}/products/${productId}`, async ({ request }) => {
        capturedPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...mockProduct, ...capturedPayload });
      }),
    );

    const user = userEvent.setup();
    renderProductForm();
    await waitForProductLoad();

    await user.click(screen.getByRole('button', { name: /archived/i }));
    await waitFor(() => {
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(capturedPayload?.status).toBe('ARCHIVED');
    });
  });

  it('sends DRAFT when switched from ACTIVE to DRAFT', async () => {
    let capturedStatus: string | null = null;

    server.use(
      http.patch(`${API}/api/tenant/${storeId}/products/${productId}`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        capturedStatus = body.status as string;
        return HttpResponse.json({ ...mockProduct, status: body.status });
      }),
    );

    const user = userEvent.setup();
    renderProductForm();
    await waitForProductLoad();

    await user.click(screen.getByRole('button', { name: /draft/i }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(capturedStatus).toBe('DRAFT');
    });
  });

  it('syncs status from server response after save', async () => {
    server.use(
      http.patch(`${API}/api/tenant/${storeId}/products/${productId}`, () =>
        HttpResponse.json({ ...mockProduct, status: 'ARCHIVED' }),
      ),
    );

    const user = userEvent.setup();
    renderProductForm();
    await waitForProductLoad();

    await user.click(screen.getByRole('button', { name: /archived/i }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      const archivedBtn = screen.getByRole('button', { name: /archived/i });
      expect(archivedBtn).toHaveStyle({ background: 'var(--accent-dim)' });
    });
  });

  it('shows live link when product is ACTIVE and saved', async () => {
    renderProductForm();
    await waitForProductLoad();
    expect(screen.getByText(/live · view on storefront/i)).toBeInTheDocument();
  });
});

// ─── save atomicity ───────────────────────────────────────────────────────────

describe('ProductForm — save atomicity', () => {
  it('shows success toast after both product and inventory save', async () => {
    const user = userEvent.setup();
    renderProductForm();
    await waitForProductLoad();

    const titleInput = screen.getByLabelText(/product name/i);
    await user.type(titleInput, ' Updated');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByText('Changes saved')).toBeInTheDocument();
    });
  });

  it('shows error and stays dirty if product update fails', async () => {
    server.use(
      http.patch(`${API}/api/tenant/${storeId}/products/${productId}`, () =>
        HttpResponse.json({ message: 'Network error' }, { status: 500 }),
      ),
    );

    const user = userEvent.setup();
    renderProductForm();
    await waitForProductLoad();

    const titleInput = screen.getByLabelText(/product name/i);
    await user.type(titleInput, ' Changed');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });
  });

  it('shows error and stays dirty if inventory update fails', async () => {
    server.use(
      http.patch(`${API}/api/tenant/${storeId}/products/${productId}/inventory`, () =>
        HttpResponse.json({ message: 'Inventory error' }, { status: 500 }),
      ),
    );

    const user = userEvent.setup();
    renderProductForm();
    await waitForProductLoad();

    const titleInput = screen.getByLabelText(/product name/i);
    await user.type(titleInput, ' Changed');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByText('Inventory error')).toBeInTheDocument();
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });
  });
});

// ─── state sync after save ────────────────────────────────────────────────────

describe('ProductForm — state sync after save', () => {
  it('updates page title to reflect new product name after save', async () => {
    server.use(
      http.patch(`${API}/api/tenant/${storeId}/products/${productId}`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...mockProduct, title: body.title });
      }),
    );

    const user = userEvent.setup();
    renderProductForm();
    await waitForProductLoad();

    const titleInput = screen.getByLabelText(/product name/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Brand New Name');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByText('Brand New Name')).toBeInTheDocument();
    });
  });

  it('resets dirty state after successful save even if status changed', async () => {
    server.use(
      http.patch(`${API}/api/tenant/${storeId}/products/${productId}`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...mockProduct, ...body });
      }),
    );

    const user = userEvent.setup();
    renderProductForm();
    await waitForProductLoad();

    await user.click(screen.getByRole('button', { name: /draft/i }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });
  });
});

// ─── navigation intercept ─────────────────────────────────────────────────────

describe('ProductForm — navigation intercept', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('shows warning modal when navigating away with unsaved changes', async () => {
    const user = userEvent.setup();
    renderProductForm();
    await waitForProductLoad();

    const titleInput = screen.getByLabelText(/product name/i);
    await user.type(titleInput, ' changed');

    await waitFor(() => {
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /back/i }));

    await waitFor(() => {
      expect(screen.getByText('Leave without saving?')).toBeInTheDocument();
    });
  });

  it('does NOT show warning modal when navigating away with no changes', async () => {
    const user = userEvent.setup();
    renderProductForm();
    await waitForProductLoad();

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.queryByText('Leave without saving?')).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith(`/dashboard/${storeId}/products`);
  });

  it('"Stay and save" closes modal and keeps user on page', async () => {
    const user = userEvent.setup();
    renderProductForm();
    await waitForProductLoad();

    const titleInput = screen.getByLabelText(/product name/i);
    await user.type(titleInput, ' changed');
    await user.click(screen.getByRole('button', { name: /back/i }));

    await waitFor(() => {
      expect(screen.getByText('Leave without saving?')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /stay and save/i }));

    await waitFor(() => {
      expect(screen.queryByText('Leave without saving?')).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
  });
});

// ─── loading state ────────────────────────────────────────────────────────────

describe('ProductForm — loading state', () => {
  it('shows skeleton while product is loading', async () => {
    server.use(
      http.get(`${API}/api/tenant/${storeId}/products/${productId}`, async () => {
        await new Promise<void>((r) => setTimeout(r, 100));
        return HttpResponse.json(mockProduct);
      }),
    );

    renderProductForm();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
    await waitForProductLoad();
  });

  it('shows error message when product fails to load', async () => {
    server.use(
      http.get(`${API}/api/tenant/${storeId}/products/${productId}`, () =>
        HttpResponse.json({ message: 'Not found' }, { status: 404 }),
      ),
    );

    renderProductForm();

    await waitFor(() => {
      expect(screen.getByText(/failed to load product/i)).toBeInTheDocument();
    });
  });
});

// ─── price field ──────────────────────────────────────────────────────────────

describe('ProductForm — price field', () => {
  it('displays price in pounds not pence on load', async () => {
    renderProductForm();
    await waitForProductLoad();

    // mockProduct.price = 4999 → should display as 49.99
    const priceInput = screen.getAllByPlaceholderText('0.00')[0];
    expect((priceInput as HTMLInputElement).value).toBe('49.99');
  });

  it('sends price in minor units (pence) on save', async () => {
    let capturedPrice: number | null = null;

    server.use(
      http.patch(`${API}/api/tenant/${storeId}/products/${productId}`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        capturedPrice = body.price as number;
        return HttpResponse.json({ ...mockProduct, price: body.price });
      }),
    );

    const user = userEvent.setup();
    renderProductForm();
    await waitForProductLoad();

    const priceInputs = screen.getAllByPlaceholderText('0.00');
    await user.clear(priceInputs[0]);
    await user.type(priceInputs[0], '99.99');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(capturedPrice).toBe(9999);
      expect(Number.isInteger(capturedPrice)).toBe(true);
    });
  });
});
