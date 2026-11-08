import { expect, test } from '@playwright/test';

import { ky, ru } from './helpers';

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
  await page.getByRole('button', { name: ky.product.zoomIn }).click();
  await page.getByRole('button', { name: ky.product.zoomIn }).click();
  await page.getByRole('button', { name: ky.product.zoomIn }).click();
  await page.getByRole('button', { name: ky.product.zoomIn }).click();
  await expect(page.getByRole('button', { name: ky.product.zoomIn })).toBeDisabled();
  await expect(page.getByRole('button', { name: ky.product.zoomOut })).toBeEnabled();
});

test('without WebGL the hero keeps the picture and the product buttons', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto('/ru');
  const products = page.getByRole('group', { name: ru.home.sceneHint });
  await products.getByRole('button', { name: 'Кымыз' }).click();
  await expect(page.getByRole('dialog', { name: 'Кымыз' })).toContainText('300');
  await expect(page.locator('main canvas')).toHaveCount(0);
  await page.goto('/ky/product/kymyz');
  await expect(page.locator('button', { hasText: /^3D$/ })).toHaveCount(0);
});

test('products on the podium: choosing one shows its price and adds it to the cart', async ({
  page,
}) => {
  await page.goto('/ru');
  await expect(page.getByRole('img', { name: ru.home.sceneLabel }).locator('canvas')).toBeVisible({
    timeout: 30_000,
  });
  const products = page.getByRole('group', { name: ru.home.sceneHint });
  await products.getByRole('button', { name: 'Бал' }).click();
  const card = page.getByRole('dialog', { name: 'Бал' });
  await expect(card).toContainText('235');
  await card.getByRole('button', { name: /В корзину/ }).click();
  await expect(page.locator('header a[href="/ru/cart"]')).toHaveAttribute('aria-label', /: [1-9]/);
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
});
