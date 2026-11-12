import { expect, test } from '@playwright/test';

import { ky, ru } from './helpers';

test('catalog search finds a product and opens its page', async ({ page }) => {
  await page.goto('/ky/catalog');
  await page.getByRole('search').last().getByRole('searchbox').fill('Кымыз');
  await page.getByRole('search').last().getByRole('searchbox').press('Enter');
  await expect(page).toHaveURL(/search=/);
  const card = page.getByRole('article').filter({ hasText: 'Кымыз' });
  await expect(card).toHaveCount(1);
  await card.getByRole('link', { name: 'Кымыз' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Кымыз');
  await expect(page.getByText('300 сом').first()).toBeVisible();
});

test('a product page tells what it is good for, what it is made of and the price', async ({
  page,
}) => {
  // Opened from the "Our products" cards of the home page.
  await page.goto('/ky');
  const products = page.locator('section[aria-labelledby="products-title"]');
  await products.getByRole('link', { name: /Сары май/ }).click();
  await expect(page).toHaveURL(/\/ky\/product\/sary-mai$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Сары май' })).toBeVisible();
  await expect(page.getByText('235 сом').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: ky.product.benefits })).toBeVisible();
  await expect(page.getByText(/Жогорку температурада күйүп кетпейт/)).toBeVisible();
  await expect(page.getByRole('heading', { name: ky.product.ingredients })).toBeVisible();
  await expect(page.getByText(/Сүт майы/).first()).toBeVisible();

  await page.goto('/ru/product/navat-0-5');
  await expect(page.getByRole('heading', { name: ru.product.benefits })).toBeVisible();
  await expect(page.getByText(/Можно класть в чай вместо сахара/)).toBeVisible();
  await expect(page.getByRole('heading', { name: ru.product.ingredients })).toBeVisible();
});

test('category filter and sorting by price', async ({ page }) => {
  await page.goto('/ky/catalog/national-sweets?sort=price_desc');
  const names = await page.getByRole('article').locator('h3').allTextContents();
  expect(names).toEqual(['Нават 0.7', 'Нават 0.6', 'Нават 0.5']);
});

test('unknown pages and products answer 404', async ({ page }) => {
  expect((await page.goto('/ky/product/does-not-exist'))?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: ky.common.notFoundTitle })).toBeVisible();
  expect((await page.goto('/ky/no-such-page'))?.status()).toBe(404);
});

test('price filter in som and sorting by name', async ({ page }) => {
  await page.goto('/ru/catalog');
  await page.getByLabel(ru.catalog.priceFrom).fill('200');
  await page.getByLabel(ru.catalog.priceTo).fill('300');
  await page.getByRole('button', { name: ru.catalog.applyPrice }).click();
  await page.waitForURL(/minPrice=200&maxPrice=300/);
  const prices = await page.locator('main article').getByText(/сом/).allTextContents();
  expect(prices.length).toBeGreaterThan(0);
  for (const text of prices) {
    const value = Number(text.replace(/\D/g, ''));
    expect(value).toBeGreaterThanOrEqual(200);
    expect(value).toBeLessThanOrEqual(300);
  }

  await page.goto('/ru/catalog?sort=name');
  const names = await page.locator('main article h3').allTextContents();
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'ru')));
});
