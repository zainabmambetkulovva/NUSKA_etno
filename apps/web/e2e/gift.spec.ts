import { expect, test } from '@playwright/test';

import { ru } from './helpers';

test('gift set builder: choose products, total from the server, 3D box, save to cart, buy now', async ({
  page,
}) => {
  await page.goto('/ru/gift-builder');
  await expect(page.getByRole('heading', { level: 1, name: ru.gift.title })).toBeVisible();
  await expect(page.getByText(ru.gift.empty)).toBeVisible();

  const add = (name: RegExp) =>
    page.getByRole('button', { name: new RegExp(`${ru.gift.add}: ${name.source}`) }).click();
  await add(/Кымыз/);
  await add(/Каттама/);
  await page
    .getByRole('group', { name: /Количество: Каттама/ })
    .getByRole('button')
    .last()
    .click();

  // 300 + 2 × 170 = 640 som, calculated by the API.
  await expect(page.getByTestId('gift-total')).toContainText('640');
  await expect(
    page.getByRole('img', { name: new RegExp(ru.gift.sceneLabel) }).locator('canvas')
  ).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole('button', { name: ru.gift.saveToCart }).click();
  await expect(page.locator('header a[href="/ru/cart"]')).toHaveAttribute('aria-label', /: 3/);

  // The draft survives a reload (kept in this browser).
  await page.reload();
  await expect(page.getByTestId('gift-total')).toContainText('640');

  // "Buy now" puts the set in the cart and opens the checkout (guests sign in first).
  await page.getByRole('button', { name: ru.gift.buyNow }).click();
  await expect(page).toHaveURL(/\/ru\/(checkout|login)/);
});
