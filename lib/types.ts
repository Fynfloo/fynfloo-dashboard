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
export type LoginResponse =
  | { accessToken: string; expiresIn: number }
  | { requiresMfa: true; mfaToken: string };

export type MfaVerifyResponse = {
  accessToken: string;
  expiresIn: number;
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

export type ProductType = 'PHYSICAL' | 'DIGITAL' | 'SERVICE';

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

export type ProductOption = {
  id: string;
  name: string;
  values: string[];
  position: number;
};

export type ProductVariant = {
  id: string;
  title: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  options: Record<string, string>;
  trackQuantity: boolean;
  onHand: number | null;
  lowStockThreshold: number | null;
  allowOversell: boolean;
  position: number;
};

export type DigitalAsset = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  maxDownloads: number;
  expiryHours: number;
  // storageKey is never returned — excluded by API
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
  productType: ProductType;
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
  options: ProductOption[];
  variants: ProductVariant[];
  digitalAsset: DigitalAsset | null;
};

export type ProductListItem = {
  id: string;
  title: string;
  handle: string;
  price: number;
  compareAtPrice: number | null;
  status: ProductStatus;
  productType: ProductType;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
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
  productType?: ProductType;
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

// ─── Variant input types ──────────────────────────────────────────────────────

export type CreateOptionInput = {
  name: string;
  values: string[];
  position?: number;
};

export type UpdateVariantInput = {
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  trackQuantity?: boolean;
  onHand?: number;
  lowStockThreshold?: number;
  allowOversell?: boolean;
  position?: number;
};

export type BulkUpdateVariantPriceInput = {
  price: number;
};

// ─── Digital asset input types ────────────────────────────────────────────────

export type UpdateDigitalAssetSettingsInput = {
  maxDownloads?: number;
  expiryHours?: number;
};
