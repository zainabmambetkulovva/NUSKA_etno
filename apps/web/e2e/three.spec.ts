import { expect, test } from '@playwright/test';

import { ky } from './helpers';

test('product page shows the 3D packaging viewer', async ({ page }) => {
  await page.goto('/ky/product/kymyz');
  await page.locator('button', { hasText: /^3D$/ }).click();
  await expect(page.locator('main canvas')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(ky.product.rotateHint)).toBeVisible();
  await page.getByRole('button', { name: ky.product.zoomIn }).click();
  await page.getByRole('button', { name: ky.product.zoomIn }).click();
  await page.getByRole('button', { name: ky.product.zoomIn }).click();
  await page.getByRole('button', { name: ky.product.zoomIn }).click();
  await expect(page.getByRole('button', { name: ky.product.zoomIn })).toBeDisabled();
  await expect(page.getByRole('button', { name: ky.product.zoomOut })).toBeEnabled();
});

test('without WebGL the product page keeps the photo and hides the 3D switch', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto('/ky/product/kymyz');
  await expect(page.getByRole('heading', { level: 1, name: 'Кымыз' })).toBeVisible();
  await expect(page.locator('button', { hasText: /^3D$/ })).toHaveCount(0);
  await expect(page.locator('main canvas')).toHaveCount(0);
});

test('home hero: WebGL clouds and pollen load on desktop and follow the mouse', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/ky');
  await expect(page.locator('[data-hero-3d="on"] canvas')).toBeVisible({ timeout: 30_000 });
  await page.mouse.move(200, 200);
  await page.mouse.move(1200, 600, { steps: 5 });
  // scrolling past the hero pauses the scene but keeps the page usable
  await page.mouse.wheel(0, 1600);
  await expect(page.getByRole('heading', { name: ky.landing.productsTitle })).toBeVisible();
  expect(errors).toEqual([]);
});

test('with reduced motion the hero stays still and loads no WebGL', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydrat/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('/ky');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(ky.home.heroTitle);
  await page.waitForTimeout(3000);
  await expect(page.locator('[data-hero-3d]')).toHaveAttribute('data-hero-3d', 'off');
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(errors).toEqual([]);
  await context.close();
});
