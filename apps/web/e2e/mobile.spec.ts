import { expect, test } from '@playwright/test';

import { expectNoHorizontalScroll, ky } from './helpers';

test('mobile menu opens with the main sections', async ({ page }) => {
  await page.goto('/ky');
  await page.getByRole('button', { name: ky.nav.menu }).click();
  const menu = page.getByRole('complementary', { name: ky.nav.menu });
  await expect(menu.getByRole('link', { name: ky.nav.catalog })).toBeVisible();
  await menu.getByRole('link', { name: ky.nav.catalog }).click();
  await expect(page).toHaveURL(/\/ky\/catalog$/);
});

for (const path of [
  '/ky',
  '/ky/catalog',
  '/ky/product/kymyz',
  '/ky/cart',
  '/ky/login',
  '/ru/pickup',
]) {
  test(`no horizontal scrolling on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expectNoHorizontalScroll(page);
  });
}
