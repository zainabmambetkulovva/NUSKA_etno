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
  await shopper.getByLabel(ky.checkout.city).fill('Бишкек');
  await shopper.getByLabel(ky.checkout.address).fill('Орозбеков көч., 136');
  await shopper.getByRole('button', { name: ky.checkout.place }).click();
  await shopper.waitForURL('**/ky/checkout/success?order=**');
  await expect(shopper.getByRole('heading', { name: ky.checkout.successTitle })).toBeVisible();
  await expect(shopper.getByText(ky.orderStatus.PENDING).first()).toBeVisible();
  const orderId = new URL(shopper.url()).searchParams.get('order')!;
  await shopper.getByRole('link', { name: ky.checkout.viewOrder }).click();
  await shopper.waitForURL(`**/ky/account/orders/${orderId}`);

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

test('the shop works by delivery: without pickup points the order goes to an address, paid on receipt', async ({
  page,
}) => {
  test.skip(!customer.password, 'Set SEED_CUSTOMER_PASSWORD');
  await page.route('**/api/pickup-locations*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );
  await page.goto('/ky/product/kattama');
  await page.locator('main').getByRole('button', { name: ky.product.addToCart }).first().click();
  await login(page, customer, '/ky/checkout');

  // no choice of pickup, the delivery form and «pay on receipt» are shown
  await expect(page.getByText(ky.checkout.methodPickup)).toHaveCount(0);
  await expect(page.getByText(ky.checkout.payOnReceipt)).toBeVisible();
  await expect(page.getByText(ky.checkout.deliveryByManager)).toBeVisible();
  await page.getByLabel(ky.checkout.phone).fill('0555 12 34 56');

  // the address is required
  await page.getByRole('button', { name: ky.checkout.place }).click();
  await expect(page.getByText(ky.validation.required).first()).toBeVisible();

  await page.getByLabel(ky.checkout.city).fill('Бишкек');
  await page.getByLabel(ky.checkout.address).fill('Орозбеков көч., 136, 5-батир');
  await page.getByLabel(ky.checkout.deliveryTime).fill('эртең 18:00дөн кийин');
  await page.getByRole('button', { name: ky.checkout.place }).click();
  await page.waitForURL('**/ky/checkout/success?order=**');
  await expect(page.getByText('Бишкек, Орозбеков көч., 136, 5-батир')).toBeVisible();
  await expect(page.getByText('эртең 18:00дөн кийин')).toBeVisible();
});
