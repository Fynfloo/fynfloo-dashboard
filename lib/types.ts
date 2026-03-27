// lib/types.ts

export type TenantRole = 'TENANT_ADMIN' | 'TEAM_MEMBER';
export type PlatformRole = 'PLATFORM_ADMIN' | 'PLATFORM_SUPPORT';

export type TenantClaim = {
  tenantId: string;
  role: TenantRole;
};

// Shape returned by GET /auth/me (from auth.service.ts getMe)
export type MeResponse = {
  id: string;
  email: string;
  tenants: TenantClaim[];
  platformRoles: PlatformRole[];
  mfaEnabled: boolean;
};

// Shape returned by GET /api/stores (from tenant.service.ts listUserStores)
export type Store = {
  id: string;
  name: string;
  subdomain: string;
  currency: string;
};

export type StoresResponse = {
  stores: Store[];
};

// Login responses
export type LoginResponse = { accessToken: string } | { requiresMfa: true; mfaToken: string };

export type MfaVerifyResponse = {
  accessToken: string;
};

export type SignupResponse = {
  message: string;
};

export type ApiError = {
  status: number;
  message: string;
};

// Product types
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
  position: number;
};

export type ProductInventory = {
  id: string;
  trackQuantity: boolean;
  onHand: number;
  reserved: number;
  lowStockThreshold: number;
  allowOversell: boolean;
};

export type Product = {
  id: string;
  storeId: string;
  title: string;
  handle: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  status: ProductStatus;
  sku: string | null;
  taxable: boolean;
  weight: number | null;
  metadata: {
    metaTitle?: string | null;
    metaDescription?: string | null;
  } | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
  inventory: ProductInventory | null;
};

export type ProductListItem = {
  id: string;
  title: string;
  handle: string;
  price: number;
  compareAtPrice: number | null;
  status: ProductStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  image: ProductImage | null;
  inventory: ProductInventory | null;
};

export type ProductListResponse = {
  products: ProductListItem[];
  total: number;
  page: number;
  limit: number;
};

export type CreateProductInput = {
  title: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  status?: ProductStatus;
  sku?: string;
  taxable?: boolean;
  weight?: number;
  metaTitle?: string;
  metaDescription?: string;
};

export type UpdateProductInput = Partial<CreateProductInput> & {
  handle?: string;
};

export type UpdateInventoryInput = {
  trackQuantity: boolean;
  onHand?: number;
  lowStockThreshold?: number;
  allowOversell?: boolean;
};
