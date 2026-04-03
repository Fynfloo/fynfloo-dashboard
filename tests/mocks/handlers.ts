// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import type { Product, ProductInventory } from '@/lib/types';

const API = 'http://localhost:8080';
const storeId = 'store-123';
const productId = 'product-123';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

export const mockProduct: Product = {
  id: productId,
  storeId,
  title: 'Premium Oxford Shirt',
  handle: 'premium-oxford-shirt',
  description: 'A fine shirt for all occasions',
  price: 4999,
  compareAtPrice: 5999,
  status: 'ACTIVE',
  sku: 'SHIRT-001',
  taxable: true,
  weight: 300,
  productType: 'PHYSICAL',
  options: [],
  variants: [],
  digitalAsset: null,
  metadata: {
    metaTitle: 'Oxford Shirt — Free UK Delivery',
    metaDescription: 'Buy our premium Oxford shirt.',
  },
  publishedAt: '2026-03-28T00:00:49.392Z',
  createdAt: '2026-03-27T14:25:48.153Z',
  updatedAt: '2026-03-28T00:00:49.396Z',
  images: [
    {
      id: 'img-1',
      url: 'https://supabase.co/storage/v1/object/public/store-assets/s/p/1.jpg',
      alt: null,
      position: 0,
    },
    {
      id: 'img-2',
      url: 'https://supabase.co/storage/v1/object/public/store-assets/s/p/2.jpg',
      alt: 'Back view',
      position: 1,
    },
  ],
  inventory: {
    id: 'inv-1',
    trackQuantity: true,
    onHand: 25,
    reserved: 0,
    lowStockThreshold: 5,
    allowOversell: false,
  },
};

export const mockProductList = {
  products: [
    {
      id: productId,
      title: 'Premium Oxford Shirt',
      handle: 'premium-oxford-shirt',
      price: 4999,
      compareAtPrice: 5999,
      status: 'ACTIVE' as const,
      publishedAt: '2026-03-28T00:00:49.392Z',
      createdAt: '2026-03-27T14:25:48.153Z',
      updatedAt: '2026-03-28T00:00:49.396Z',
      images: [
        {
          id: 'img-1',
          url: 'https://supabase.co/storage/v1/object/public/store-assets/s/p/1.jpg',
          alt: null,
          position: 0,
        },
      ],
      inventory: {
        id: 'inv-1',
        trackQuantity: true,
        onHand: 25,
        reserved: 0,
        lowStockThreshold: 5,
        allowOversell: false,
      } satisfies ProductInventory,
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
};

export const mockCollections = {
  collections: [
    {
      id: 'col-1',
      handle: 'featured',
      name: 'Featured',
      description: 'Appears on the homepage',
      type: 'MANUAL',
      _count: { products: 3 },
    },
    {
      id: 'col-2',
      handle: 'new-in',
      name: 'New In',
      description: 'New arrivals',
      type: 'MANUAL',
      _count: { products: 1 },
    },
  ],
};

// ─── Typed request body helper ────────────────────────────────────────────────
// Used in handlers that need to read the request body and spread it.
// Typed as Partial<Product> so we get proper types without any.

type PartialProduct = Partial<Product>;
type PartialInventory = Partial<ProductInventory>;

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const handlers = [
  // Auth
  http.post(`${API}/auth/refresh`, () => HttpResponse.json({ accessToken: 'test-access-token' })),

  // Products list
  http.get(`${API}/api/tenant/${storeId}/products`, () => HttpResponse.json(mockProductList)),

  // Single product
  http.get(`${API}/api/tenant/${storeId}/products/${productId}`, () =>
    HttpResponse.json(mockProduct),
  ),

  // Update product
  http.patch(`${API}/api/tenant/${storeId}/products/${productId}`, async ({ request }) => {
    const body = (await request.json()) as PartialProduct;
    return HttpResponse.json({ ...mockProduct, ...body });
  }),

  // Delete product
  http.delete(`${API}/api/tenant/${storeId}/products/${productId}`, () =>
    HttpResponse.json({ ok: true }),
  ),

  // Create product
  http.post(`${API}/api/tenant/${storeId}/products`, async ({ request }) => {
    const body = (await request.json()) as PartialProduct;
    return HttpResponse.json({
      ...mockProduct,
      id: 'new-product-id',
      title: body.title ?? 'New Product',
      status: body.status ?? 'DRAFT',
    });
  }),

  // Inventory
  http.patch(
    `${API}/api/tenant/${storeId}/products/${productId}/inventory`,
    async ({ request }) => {
      const body = (await request.json()) as PartialInventory;
      return HttpResponse.json({ ...mockProduct.inventory, ...body });
    },
  ),

  // Images
  http.post(`${API}/api/tenant/${storeId}/products/${productId}/images`, () =>
    HttpResponse.json({
      id: 'img-new',
      url: 'https://supabase.co/storage/v1/object/public/store-assets/s/p/new.jpg',
      alt: null,
      position: 2,
    }),
  ),

  http.delete(`${API}/api/tenant/${storeId}/products/${productId}/images/:imageId`, () =>
    HttpResponse.json({ ok: true }),
  ),

  http.patch(`${API}/api/tenant/${storeId}/products/${productId}/images/reorder`, () =>
    HttpResponse.json({ ok: true }),
  ),

  // Collections
  http.get(`${API}/api/tenant/${storeId}/collections`, () => HttpResponse.json(mockCollections)),

  http.get(`${API}/api/tenant/${storeId}/products/${productId}/collections`, () =>
    HttpResponse.json({ collections: [{ id: 'col-1', handle: 'featured', name: 'Featured' }] }),
  ),

  http.post(`${API}/api/tenant/${storeId}/products/${productId}/collections`, () =>
    HttpResponse.json({ ok: true }),
  ),

  http.delete(`${API}/api/tenant/${storeId}/products/${productId}/collections/:collectionId`, () =>
    HttpResponse.json({ ok: true }),
  ),
];
