import type { Page as ApiPage, ProductCard } from '@nuska/types';
import { expect, test } from '@playwright/test';

import { ru } from './helpers';

test('guest cart is checked by the server: changed price and stock are shown, then fixed', async ({
  page,
}) => {
  const list = (await (
    await page.request.get('/api/products?limit=50&locale=ru')
  ).json()) as ApiPage<ProductCard>;
  // a product with tracked stock if there is one (the seed may not track stock)
  const product =
    list.data.find((p) => p.inStock && p.availableQuantity !== null) ??
    list.data.find((p) => p.inStock)!;
  const stock = product.availableQuantity;
  // the browser remembers an older, lower price and more than the stock
  const stale = { ...product, price: { ...product.price, amount: product.price.amount - 1000 } };
  await page.addInitScript(
    ([item]) =>
      window.localStorage.setItem(
        'nuska-guest-cart',
        JSON.stringify({ state: { items: [item] }, version: 1 })
      ),
    [{ productId: product.id, quantity: (stock ?? 2) + 5, product: stale }] as const
  );

  await page.goto('/ru/cart', { waitUntil: 'networkidle' });
  await expect(page.getByText(ru.cart.attention)).toBeVisible();
  if (stock !== null)
    await expect(page.getByText(ru.cart.onlyLeft.replace('{n}', String(stock)))).toBeVisible();
  await expect(page.getByText(/Цена изменилась/)).toBeVisible();

  await page.getByRole('button', { name: ru.cart.fix }).click();
  await expect(page.getByText(ru.cart.attention)).toBeHidden();
  await expect(page.getByText(/Цена изменилась/)).toBeHidden();
  if (stock !== null) {
    // the quantity was lowered to the stock and «+» is now disabled
    const stepper = page.getByRole('group', { name: ru.product.quantity });
    await expect(stepper).toContainText(String(stock));
    await expect(stepper.getByRole('button', { name: '+' })).toBeDisabled();
  }
});
