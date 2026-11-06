import { expect, test } from '@playwright/test';

import { admin, customer, ky, login } from './helpers';

test('guest cart → login → checkout → admin confirms → customer sees the status', async ({
  browser,
}) => {
  test.skip(
    !customer.password || !admin.password,
    'Set SEED_CUSTOMER_PASSWORD and SEED_ADMIN_PASSWORD'
  );

  const shopper = await (await browser.newContext()).newPage();
  await shopper.goto('/ky/product/kattama');
  await shopper.locator('main').getByRole('button', { name: ky.product.addToCart }).first().click();
  await expect(shopper.locator('header a[href="/ky/cart"]')).toHaveAttribute(
    'aria-label',
    /: [1-9]/
  );

  await login(shopper, customer, '/ky/checkout');
  // The guest cart was merged into the account.
  await expect(shopper.getByText('Каттама').first()).toBeVisible();
  await shopper.getByLabel(ky.checkout.phone).fill('0555 12 34 56');
  await shopper.getByRole('button', { name: ky.checkout.place }).click();
  await shopper.waitForURL('**/ky/account/orders/**');
  await expect(shopper.getByText(ky.orderStatus.PENDING).first()).toBeVisible();
  const orderId = shopper.url().split('/').pop()!;

  const manager = await (await browser.newContext()).newPage();
  await login(manager, admin, '/ky/admin');
  await manager.goto(`/ky/admin/orders/${orderId}`);
  await manager.getByRole('button', { name: ky.orderStatus.CONFIRMED }).click();
  await expect(manager.getByText(ky.orderStatus.CONFIRMED).first()).toBeVisible();

  await shopper.reload();
  await expect(shopper.getByText(ky.orderStatus.CONFIRMED).first()).toBeVisible();
  await shopper.goto('/ky/account/notifications');
  await expect(shopper.getByText(/ырасталды/).first()).toBeVisible();
});

test('checkout requires signing in', async ({ page }) => {
  await page.goto('/ky/checkout');
  await expect(page).toHaveURL(/\/ky\/login\?next=/);
});
