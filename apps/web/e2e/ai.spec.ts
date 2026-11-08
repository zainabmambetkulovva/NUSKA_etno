import { expect, test } from '@playwright/test';

import { ky, ru } from './helpers';

test('NUSKA AI widget: honest mode badge, budget set from the catalog, add to cart by button', async ({
  page,
}) => {
  await page.goto('/ru');
  await page.getByRole('button', { name: ru.ai.open }).click();
  const panel = page.getByRole('dialog', { name: ru.ai.name });
  await expect(panel).toBeVisible();
  // Without an API key the assistant says so.
  await expect(panel.getByText(ru.ai.modeCatalog)).toBeVisible();

  await panel.getByRole('button', { name: ru.ai.examples[1] }).click();
  await expect(panel.getByText(ru.ai.proposal)).toBeVisible();
  // Nothing was added by the assistant itself.
  await expect(page.locator('header a[href="/ru/cart"]')).toHaveAttribute('aria-label', /: 0$/);
  await panel.getByRole('button', { name: ru.ai.addAll }).click();
  await expect(page.locator('header a[href="/ru/cart"]')).toHaveAttribute('aria-label', /: [1-9]/);

  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});

test('the examples on the home page open the small NUSKA AI window with an answer', async ({
  page,
}) => {
  await page.goto('/ky');
  await page.getByRole('button', { name: ky.ai.examples[0] }).first().click();
  const panel = page.getByRole('dialog', { name: ky.ai.name });
  await expect(panel).toBeVisible();
  await expect(panel.getByText(ky.ai.proposal)).toBeVisible();

  await panel.getByLabel(ky.ai.placeholder).fill('Заказды кантип алам?');
  await panel.getByRole('button', { name: ky.ai.send }).click();
  await expect(panel.getByText(/Алып кетүү жайлары/)).toBeVisible();
  // There is no separate assistant page any more.
  expect((await page.request.get('/ky/assistant')).status()).toBe(404);
});
