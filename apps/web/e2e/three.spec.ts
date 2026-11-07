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
  await page.getByRole('button', { name: ky.product.zoomIn }).click();
  await page.getByRole('button', { name: ky.product.zoomIn }).click();
  await page.getByRole('button', { name: ky.product.zoomIn }).click();
  await page.getByRole('button', { name: ky.product.zoomIn }).click();
  await expect(page.getByRole('button', { name: ky.product.zoomIn })).toBeDisabled();
  await expect(page.getByRole('button', { name: ky.product.zoomOut })).toBeEnabled();
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

test('clicking a product on the dastorkon zooms in and shows its card with the price', async ({
  page,
}) => {
  await page.goto('/ru');
  const canvas = page.getByRole('img', { name: /дасторкон/ }).locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2500); // items appear one by one
  const box = (await canvas.boundingBox())!;
  // Kattama lies in the centre of the dastorkon.
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.52);
  const card = page.getByRole('dialog', { name: 'Каттама' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('170');
  await card.getByRole('button', { name: /В корзину/ }).click();
  await expect(page.locator('header a[href="/ru/cart"]')).toHaveAttribute('aria-label', /: [1-9]/);
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
});

test('brand story scene loads when scrolled into view', async ({ page }) => {
  await page.goto('/ky');
  const story = page.getByRole('img', { name: ky.home.storySceneLabel });
  await story.scrollIntoViewIfNeeded();
  await expect(story.locator('canvas')).toBeVisible({ timeout: 30_000 });
});
