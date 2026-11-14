import { expect, test } from '@playwright/test';

import { ky, ru } from './helpers';

test('opens in Kyrgyz, switches to Russian and remembers the choice', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/ky$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ky');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(ky.home.heroTitle);

  await page.locator('header').getByRole('button', { name: ky.nav.language }).click();
  await page.getByRole('menuitem', { name: /Русский/ }).click();
  await expect(page).toHaveURL(/\/ru$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(ru.home.heroTitle);

  await page.goto('/');
  await expect(page).toHaveURL(/\/ru$/);
});

test('every page has localised metadata and hreflang links', async ({ page }) => {
  await page.goto('/ky/catalog');
  await expect(page).toHaveTitle(new RegExp(ky.catalog.title));
  await expect(page.locator('link[hreflang="ru"]')).toHaveAttribute('href', /\/ru\/catalog$/);
});
