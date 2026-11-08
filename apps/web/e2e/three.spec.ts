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
  await expect(page.getByRole('img', { name: 'Кымыз' }).first()).toBeVisible();
  await expect(page.locator('button', { hasText: /^3D$/ })).toHaveCount(0);
  await expect(page.locator('main canvas')).toHaveCount(0);
});
