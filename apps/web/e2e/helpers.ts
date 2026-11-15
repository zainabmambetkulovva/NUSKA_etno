import { expect, type Page } from '@playwright/test';

import ky from '../src/i18n/dictionaries/ky';
import ru from '../src/i18n/dictionaries/ru';

export { ky, ru };

/** Demo accounts created by `pnpm db:seed` (passwords from SEED_*_PASSWORD). */
export const customer = {
  email: process.env.SEED_CUSTOMER_EMAIL || 'customer@example.com',
  password: process.env.SEED_CUSTOMER_PASSWORD || '',
};
export const admin = {
  email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.SEED_ADMIN_PASSWORD || '',
};

export async function login(
  page: Page,
  account: { email: string; password: string },
  next = '/ky/account'
) {
  await page.goto(`/ky/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel(ky.auth.email).fill(account.email);
  await page.getByLabel(ky.auth.password).fill(account.password);
  await page.locator('form').getByRole('button', { name: ky.auth.login }).click();
  await page.waitForURL(`**${next}`);
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
}
