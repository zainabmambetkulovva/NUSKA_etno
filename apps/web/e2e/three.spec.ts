import { expect, test } from '@playwright/test';

import { ky } from './helpers';

test('home page shows the 3D dastorkon scene', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/ky');
  await expect(page.getByRole('img', { name: ky.home.sceneLabel }).locator('canvas')).toBeVisible({
    timeout: 30_000,
  });
  expect(errors).toEqual([]);
});

test('product page shows the 3D packaging viewer', async ({ page }) => {
  await page.goto('/ky/product/kymyz');
  await page.locator('button', { hasText: /^3D$/ }).click();
  await expect(page.locator('main canvas')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(ky.product.rotateHint)).toBeVisible();
});

test('without WebGL the site falls back to the 2D composition', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto('/ky');
  await expect(page.getByText('Каттама', { exact: true }).first()).toBeVisible();
  await expect(page.locator('main canvas')).toHaveCount(0);
  await page.goto('/ky/product/kymyz');
  await expect(page.locator('button', { hasText: /^3D$/ })).toHaveCount(0);
});
