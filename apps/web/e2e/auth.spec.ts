import { expect, test } from '@playwright/test';

import { ky, ru } from './helpers';

test('register: password twice and the terms are required, then the account opens', async ({
  page,
}) => {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto('/ru/register', { waitUntil: 'networkidle' });
  const form = page.locator('main form');
  await form.getByLabel(ru.auth.firstName).fill('Айгерим');
  await form.getByLabel(ru.auth.email, { exact: true }).fill(email);
  await form.getByLabel(ru.auth.password, { exact: true }).fill('Secret123');
  await form.getByLabel(ru.auth.passwordConfirm).fill('Secret124');
  await form.getByRole('button', { name: ru.auth.register }).click();
  await expect(page.getByText(ru.auth.passwordMismatch)).toBeVisible();
  await expect(page.getByText(ru.auth.acceptTermsRequired)).toBeVisible();
  // the terms and privacy links open the documents
  await expect(form.getByRole('link', { name: ru.auth.acceptTermsTerms })).toHaveAttribute(
    'href',
    '/ru/terms'
  );

  await form.getByLabel(ru.auth.passwordConfirm).fill('Secret123');
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: ru.auth.register }).click();
  await page.waitForURL('**/ru/account');

  // security: this device is listed, «sign out everywhere» ends the session
  await page.goto('/ru/account/settings', { waitUntil: 'networkidle' });
  const security = page.locator('section[aria-labelledby="security-title"]');
  await expect(security.getByText(ru.account.thisDevice)).toBeVisible();
  await expect(security.getByText(email)).toBeVisible();
  await security.getByRole('button', { name: ru.account.logoutAll }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: ru.common.confirm }).click();
  await page.waitForURL(/\/ru\/login/);
  await page.goto('/ru/account');
  await page.waitForURL(/\/ru\/login/);
});

test('signs in with the phone number given at registration', async ({ page }) => {
  const email = `phone-${Date.now()}@example.com`;
  const digits = String(Date.now()).slice(-6);
  await page.goto('/ky/register', { waitUntil: 'networkidle' });
  const form = page.locator('main form');
  await form.getByLabel(ky.auth.firstName, { exact: true }).fill('Телефон');
  await form.getByLabel(ky.auth.email, { exact: true }).fill(email);
  await form.getByLabel(new RegExp(`^${ky.auth.phone}`)).fill(`0700${digits.slice(0, 6)}`);
  await form.getByLabel(ky.auth.password, { exact: true }).fill('Secret123');
  await form.getByLabel(ky.auth.passwordConfirm).fill('Secret123');
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: ky.auth.register }).click();
  await page.waitForURL('**/ky/account');

  await page.context().clearCookies();
  await page.goto('/ky/login?next=%2Fky%2Faccount', { waitUntil: 'networkidle' });
  const login = page.locator('main form');
  // not an e-mail and not a number
  await login.getByLabel(ky.auth.emailOrPhone).fill('hello');
  await login.getByLabel(ky.auth.password, { exact: true }).fill('Secret123');
  await login.getByRole('button', { name: ky.auth.login }).click();
  await expect(page.getByText(ky.validation.emailOrPhone)).toBeVisible();
  // a wrong password
  await login
    .getByLabel(ky.auth.emailOrPhone)
    .fill(`+996 700 ${digits.slice(0, 3)} ${digits.slice(3)}`);
  await login.getByLabel(ky.auth.password, { exact: true }).fill('Wrong1234');
  await login.getByRole('button', { name: ky.auth.login }).click();
  await expect(page.getByText(ky.errors.INVALID_CREDENTIALS)).toBeVisible();
  // the right one, the number typed another way
  await login.getByLabel(ky.auth.password, { exact: true }).fill('Secret123');
  await login.getByRole('button', { name: ky.auth.login }).click();
  await page.waitForURL('**/ky/account');
});
