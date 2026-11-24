import { expect, test } from '@playwright/test';

import { ru } from './helpers';

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
