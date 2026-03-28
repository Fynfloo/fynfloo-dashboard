// tests/e2e/helpers/auth.ts
//
// Reusable E2E test helpers.
// Auth helper logs in once and saves session to disk so subsequent
// tests don't repeat the login flow.

import { type Page } from '@playwright/test';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export const TEST_CREDENTIALS = {
  email: process.env.E2E_TEST_EMAIL ?? 'test@fynfloo.com',
  password: process.env.E2E_TEST_PASSWORD ?? 'TestPassword123!',
};

export const TEST_STORE_ID = process.env.E2E_STORE_ID ?? '';

/**
 * Logs in via the dashboard UI and waits for the dashboard to load.
 * Call this once per test file using test.beforeAll.
 */
export async function loginAsMerchant(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(TEST_CREDENTIALS.email);
  await page.getByLabel(/password/i).fill(TEST_CREDENTIALS.password);
  // Button text is 'Continue' not 'Sign in'
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Navigates to the product edit page and waits for it to load.
 */
export async function goToProductEdit(page: Page, storeId: string, productId: string) {
  await page.goto(`/dashboard/${storeId}/products/${productId}`);
  // Wait for skeleton to disappear — form title appears
  await page
    .waitForSelector('h1:not(:text("Edit product"))', { timeout: 10000 })
    .catch(() => page.waitForSelector('form', { timeout: 10000 }));
}

// Module-level cache — valid for the lifetime of one worker process (workers: 1).
let _cachedToken: string | null = null;

async function getApiToken(page: Page): Promise<string> {
  if (_cachedToken) return _cachedToken;

  const loginRes = await page.request.post(`${API_URL}/auth/login`, {
    data: {
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password,
    },
  });
  const body = await loginRes.json();
  _cachedToken = body.accessToken ?? '';
  return _cachedToken as string;
}

/**
 * Creates a test product via the API directly (faster than UI).
 * Returns the product ID.
 */
export async function createTestProduct(
  page: Page,
  storeId: string,
  overrides: Partial<{
    title: string;
    status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
    price: number;
  }> = {},
): Promise<string> {
  const accessToken = await getApiToken(page);

  const res = await page.request.post(`${API_URL}/api/tenant/${storeId}/products`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    data: {
      title: overrides.title ?? `Test Product ${Date.now()}`,
      status: overrides.status ?? 'DRAFT',
      price: overrides.price ?? 1999,
    },
  });

  const product = await res.json();
  return product.id;
}

/**
 * Deletes a test product via the API directly (cleanup).
 */
export async function deleteTestProduct(
  page: Page,
  storeId: string,
  productId: string,
): Promise<void> {
  const accessToken = await getApiToken(page);

  await page.request.delete(`${API_URL}/api/tenant/${storeId}/products/${productId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
