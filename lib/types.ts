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
