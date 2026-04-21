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
// stripeChargesEnabled — DB-backed fast check used for the nudge banner.
// For live status call GET /api/payments/dashboard/:tenantId/connect-status.
export type Store = {
  id: string;
  name: string;
  subdomain: string;
  currency: string;
  stripeChargesEnabled: boolean;
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

// ─── Discount types ───────────────────────────────────────────────────────────

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export type DiscountCode = {
  id: string;
  code: string;
  type: DiscountType;
  value: number; // percentage (20) or pence (1000) — 0 for FREE_SHIPPING
  minOrderValue: number | null; // pence
  usageLimit: number | null;
  usageCount: number;
  active: boolean;
  expiresAt: string | null; // ISO string
  createdAt: string;
  updatedAt: string;
};

export type CreateDiscountInput = {
  code: string;
  type: DiscountType;
  value: number;
  minOrderValue?: number; // pence
  usageLimit?: number;
  expiresAt?: string; // ISO string
};

export type UpdateDiscountInput = {
  value?: number;
  minOrderValue?: number;
  usageLimit?: number;
  expiresAt?: string;
  active?: boolean;
};

// ─── Order types ──────────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'CANCELLED';

export type FulfilmentStatus = 'UNFULFILLED' | 'FULFILLED';

export type OrderEventType =
  | 'ORDER_PLACED'
  | 'PAYMENT_CONFIRMED'
  | 'ORDER_FULFILLED'
  | 'TRACKING_ADDED'
  | 'NOTE_ADDED'
  | 'ORDER_REFUNDED';

export type OrderListItem = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  fulfilmentStatus: FulfilmentStatus;
  totalPence: number;
  currency: string;
  itemCount: number;
  customerName: string | null;
  email: string | null;
  createdAt: string;
  paidAt: string | null;
};

export type OrderListResponse = {
  orders: OrderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type OrderItem = {
  id: string;
  name: string;
  sku: string | null;
  pricePence: number;
  quantity: number;
  imageUrl: string | null;
  variantTitle: string | null;
  weightGrams: number | null;
};

export type OrderRefund = {
  id: string;
  amountPence: number;
  reason: string | null;
  createdAt: string;
};

export type OrderEvent = {
  id: string;
  type: OrderEventType;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type OrderDetail = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  fulfilmentStatus: FulfilmentStatus;
  currency: string;
  subtotalPence: number;
  shippingPence: number;
  discountCode: string | null;
  discountPence: number | null;
  totalPence: number;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  customerId: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postCode: string | null;
  country: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  courierName: string | null;
  notes: string | null;
  customerNote: string | null;
  paymentIntentId: string | null;
  fulfilledAt: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  items: OrderItem[];
  refunds: OrderRefund[];
  events: OrderEvent[];
};

export type OrderSummary = {
  unfulfilledCount: number;
};

export type FulfilOrderInput = {
  trackingNumber?: string;
  courierName?: string;
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export type AnalyticsPeriod = 7 | 30 | 90;

export interface AnalyticsOverview {
  period: AnalyticsPeriod;
  revenuePence: number;
  orders: number;
  avgOrderValuePence: number;
  customers: number;
  newCustomers: number;
  returningCustomers: number;
  revenueChange: number | null;
  ordersChange: number | null;
}

export interface RevenueDataPoint {
  date: string;
  revenuePence: number;
  orders: number;
}

export interface AnalyticsRevenue {
  period: AnalyticsPeriod;
  data: RevenueDataPoint[];
}

export interface TopProduct {
  productId: string;
  name: string;
  revenuePence: number;
  unitsSold: number;
}

export interface AnalyticsTopProducts {
  byRevenue: TopProduct[];
  byUnits: TopProduct[];
}

// ─── Customers ────────────────────────────────────────────────────────────────

export interface CustomerListItem {
  id: string;
  name: string | null;
  email: string;
  orderCount: number;
  totalSpentPence: number;
  lastOrderAt: string | null;
  createdAt: string;
}

export interface CustomerListResponse {
  customers: CustomerListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export type StoreSettings = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  logoUrl: string | null;
  currency: string;
  timezone: string;
  domain: string | null;
  status: string;
  businessType: string | null;
  templateKey: string | null;
  themeSettings: Record<string, unknown> | null;
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean;
};

export type UpdateSettingsInput = {
  name?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  timezone?: string;
};

export type UpdateThemeInput = {
  themeSettings: Record<string, unknown>;
};

export type ThemeSettings = {
  primaryColour?: string;
  secondaryColour?: string;
  fontFamily?: string;
  borderRadius?: string;
  buttonStyle?: string;
  [key: string]: unknown;
};

// ─── Stripe Connect ───────────────────────────────────────────────────────────

// Discriminated union — narrow on connected before accessing capability fields.
// connected: false — no stripeAccountId stored, merchant has never connected.
// connected: true  — stripeAccountId exists, live Stripe status fields populated.
//
// Two-layer status model:
//   Layer 1: Store.stripeChargesEnabled — DB-backed, zero API calls, for nudge banner.
//   Layer 2: StripeConnectStatus — live Stripe API call, for payments settings page.
export type StripeConnectStatus =
  | { connected: false }
  | {
      connected: true;
      id: string;
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      detailsSubmitted: boolean;
      requirements?: unknown[];
    };

export type Session = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

export type MfaSetupData = {
  secret: string;
  qrCodeUrl: string;
};
