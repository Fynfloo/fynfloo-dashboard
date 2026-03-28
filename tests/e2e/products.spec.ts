// tests/e2e/products.spec.ts
//
// Layer 3 — End-to-end critical path tests
//
// These run against the real running app (Next.js dev server + real API).
// Auth is token-based in memory — each test logs in independently.
// No beforeEach — loginAsMerchant is called per test to avoid session loss
// across page.goto() calls.
//
// Prerequisites:
//   - Dashboard dev server running on localhost:3000
//   - API running on localhost:8080
//   - .env.e2e filled with real E2E_TEST_EMAIL, E2E_TEST_PASSWORD,
//     E2E_STORE_ID env vars

import { test, expect } from '@playwright/test';
import {
  loginAsMerchant,
  createTestProduct,
  deleteTestProduct,
  goToProductEdit,
} from './helpers/auth';

const storeId = process.env.E2E_STORE_ID ?? 'SET_E2E_STORE_ID_ENV_VAR';

// ─── Critical path 1 — Create product flow ───────────────────────────────────

test('CP1: Add product button opens modal, create redirects to edit page', async ({ page }) => {
  await loginAsMerchant(page);
  await page.goto(`/dashboard/${storeId}/products`);

  await page.getByRole('button', { name: /add product/i }).click();
  await expect(page.getByText('Add a new product')).toBeVisible();

  await page.getByPlaceholder('e.g. Blue Oxford Shirt').fill('E2E Test Product');
  await page.getByRole('button', { name: 'Create product' }).click();

  // Should redirect to edit page
  await page.waitForURL(/\/dashboard\/.+\/products\/.+/, { timeout: 10000 });
  await expect(page.getByText('E2E Test Product')).toBeVisible();

  // Image upload should be enabled on the edit page
  const uploadZone = page.locator('label').filter({ hasText: /drop images/i });
  await expect(uploadZone).toBeVisible();
  await expect(uploadZone).not.toHaveClass(/opacity-50/);

  // Clean up
  const newProductId = page.url().split('/').pop()!;
  await deleteTestProduct(page, storeId, newProductId);
});

test('CP1b: /products/new redirects to products list', async ({ page }) => {
  await loginAsMerchant(page);
  await page.goto(`/dashboard/${storeId}/products/new`);
  await page.waitForURL(`/dashboard/${storeId}/products`, { timeout: 5000 });
  await expect(page).toHaveURL(`/dashboard/${storeId}/products`);
});

// ─── Critical path 2 — Archive product ───────────────────────────────────────
// Storefront URL is not tested here — it only resolves in production.
// The dashboard side (status persisting, live link disappearing) is tested.

test('CP2: Archiving a product saves correctly and hides live link', async ({ page }) => {
  await loginAsMerchant(page);

  const productId = await createTestProduct(page, storeId, {
    title: 'E2E Archive Test',
    status: 'ACTIVE',
    price: 1999,
  });

  await goToProductEdit(page, storeId, productId);

  // Verify loaded as Active — live link visible
  await expect(page.getByText('Live · View on storefront')).toBeVisible();

  // Archive it
  await page.getByRole('button', { name: /archived/i }).click();
  await expect(page.getByText('Unsaved changes')).toBeVisible();

  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Changes saved')).toBeVisible({ timeout: 5000 });

  // Reload and verify status persisted — live link must not appear for archived product
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Live · View on storefront')).not.toBeVisible();

  await deleteTestProduct(page, storeId, productId);
});

// ─── Critical path 3 — Image reorder persists ────────────────────────────────

test('CP3: Image reorder persists after page refresh', async ({ page }) => {
  await loginAsMerchant(page);

  const productId = await createTestProduct(page, storeId, {
    title: 'E2E Reorder Test',
    status: 'DRAFT',
  });

  await goToProductEdit(page, storeId, productId);

  const imageCount = await page.locator('[data-card-index]').count();

  if (imageCount >= 2) {
    const firstImage = page.locator('[data-card-index="0"]');
    const secondImage = page.locator('[data-card-index="1"]');
    const firstImageSrc = await firstImage.locator('img').getAttribute('src');

    await firstImage.dragTo(secondImage);

    await page.waitForResponse(
      (res) => res.url().includes('/images/reorder') && res.status() === 200,
    );

    await page.reload();
    await page.waitForLoadState('networkidle');

    const newFirstImageSrc = await page
      .locator('[data-card-index="0"]')
      .locator('img')
      .getAttribute('src');

    expect(newFirstImageSrc).not.toBe(firstImageSrc);
  }

  await deleteTestProduct(page, storeId, productId);
});

// ─── Critical path 4 — Price saved and displayed correctly ───────────────────

test('CP4: Price entered in pounds saved as pence, displayed correctly', async ({ page }) => {
  await loginAsMerchant(page);

  const productId = await createTestProduct(page, storeId, {
    title: 'E2E Price Test',
    status: 'DRAFT',
    price: 0,
  });

  await goToProductEdit(page, storeId, productId);

  const priceInput = page.getByPlaceholder('0.00').first();
  await priceInput.clear();
  await priceInput.fill('49.99');

  // Intercept PATCH to verify payload
  let capturedPrice: number | null = null;
  page.on('request', (req) => {
    if (req.url().includes('/products/') && req.method() === 'PATCH') {
      try {
        const body = JSON.parse(req.postData() ?? '{}') as Record<string, unknown>;
        if (body.price !== undefined) capturedPrice = body.price as number;
      } catch {}
    }
  });

  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Changes saved')).toBeVisible({ timeout: 5000 });

  // Must have sent 4999 (pence), not 49.99 (float)
  expect(capturedPrice).toBe(4999);

  // Reload and verify price displays as 49.99
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByPlaceholder('0.00').first()).toHaveValue('49.99');

  await deleteTestProduct(page, storeId, productId);
});

// ─── Critical path 5 — Unsaved changes intercept ─────────────────────────────

test('CP5: Navigation away with unsaved changes shows intercept modal', async ({ page }) => {
  await loginAsMerchant(page);

  const productId = await createTestProduct(page, storeId, {
    title: 'E2E Nav Test',
    status: 'DRAFT',
  });

  await goToProductEdit(page, storeId, productId);

  await page.getByLabel(/product name/i).fill('Changed Title');
  await expect(page.getByText('Unsaved changes')).toBeVisible();

  await page.getByRole('button', { name: /back/i }).click();
  await expect(page.getByText('Leave without saving?')).toBeVisible();

  await page.getByRole('button', { name: /leave anyway/i }).click();
  await expect(page).toHaveURL(`/dashboard/${storeId}/products`);

  await deleteTestProduct(page, storeId, productId);
});

test('CP5b: Sidebar navigation with unsaved changes shows intercept modal', async ({ page }) => {
  await loginAsMerchant(page);

  const productId = await createTestProduct(page, storeId, {
    title: 'E2E Sidebar Nav Test',
    status: 'DRAFT',
  });

  await goToProductEdit(page, storeId, productId);

  await page.getByLabel(/product name/i).fill('Changed');
  await expect(page.getByText('Unsaved changes')).toBeVisible();

  await page.getByRole('button', { name: /orders/i }).click();
  await expect(page.getByText('Leave without saving?')).toBeVisible();

  await page.getByRole('button', { name: /stay and save/i }).click();
  await expect(page.getByText('Leave without saving?')).not.toBeVisible();
  await expect(page).toHaveURL(/\/products\//);

  await deleteTestProduct(page, storeId, productId);
});

// ─── Critical path 6 — Status change saves correctly ─────────────────────────

test('CP6: Status change from Active to Archived is saved correctly', async ({ page }) => {
  await loginAsMerchant(page);

  const productId = await createTestProduct(page, storeId, {
    title: 'E2E Status Test',
    status: 'ACTIVE',
    price: 1999,
  });

  await goToProductEdit(page, storeId, productId);
  await expect(page.getByText('Live · View on storefront')).toBeVisible();

  await page.getByRole('button', { name: /archived/i }).click();
  await expect(page.getByText('Unsaved changes')).toBeVisible();

  // Intercept to verify correct status sent — catches the stale closure bug
  let sentStatus: string | null = null;
  page.on('request', (req) => {
    if (req.url().includes(`/products/${productId}`) && req.method() === 'PATCH') {
      try {
        const body = JSON.parse(req.postData() ?? '{}') as Record<string, unknown>;
        if (body.status) sentStatus = body.status as string;
      } catch {}
    }
  });

  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Changes saved')).toBeVisible({ timeout: 5000 });

  expect(sentStatus).toBe('ARCHIVED');

  // Reload and verify persisted
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Live · View on storefront')).not.toBeVisible();

  await deleteTestProduct(page, storeId, productId);
});

// ─── Critical path 7 — Product list shows correct images ─────────────────────

test('CP7: Product list renders image thumbnails or placeholder correctly', async ({ page }) => {
  await loginAsMerchant(page);
  await page.goto(`/dashboard/${storeId}/products`);
  await page.waitForSelector('table tbody tr', { timeout: 10000 });

  const imgThumbnail = page.locator('table tbody tr img').first();
  const placeholder = page.locator('[title="Add image"]').first();

  const hasImage = (await imgThumbnail.count()) > 0;
  const hasPlaceholder = (await placeholder.count()) > 0;

  expect(hasImage || hasPlaceholder).toBe(true);

  if (hasImage) {
    const src = await imgThumbnail.getAttribute('src');
    expect(src).toContain('supabase.co');
  }
});

// ─── Critical path 8 — Delete product ────────────────────────────────────────

test('CP8: Deleting a product removes it from the list', async ({ page }) => {
  await loginAsMerchant(page);

  await createTestProduct(page, storeId, {
    title: 'E2E Delete Test',
    status: 'DRAFT',
  });

  await page.goto(`/dashboard/${storeId}/products`);
  await page.waitForSelector('table tbody tr');

  const row = page.locator('table tbody tr').filter({ hasText: 'E2E Delete Test' });
  await expect(row).toBeVisible();

  await row.locator('button').last().click();
  await page.getByText('Delete product').click();

  await expect(page.getByText('Delete product?')).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).click();

  await expect(
    page.locator('table tbody tr').filter({ hasText: 'E2E Delete Test' }),
  ).not.toBeVisible({ timeout: 5000 });
});
