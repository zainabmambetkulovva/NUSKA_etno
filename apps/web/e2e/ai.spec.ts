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

test('assistant page answers a question from the link and shows the 3D symbol', async ({
  page,
}) => {
  await page.goto(`/ky/assistant?q=${encodeURIComponent(ky.ai.examples[0])}`);
  await expect(page.getByRole('heading', { level: 1, name: ky.ai.name })).toBeVisible();
  await expect(page.getByText(ky.ai.proposal)).toBeVisible();
  await expect(page.getByTestId('ai-symbol').locator('canvas')).toBeVisible({ timeout: 30_000 });
  // The floating widget is not duplicated on the assistant page.
  await expect(page.getByRole('button', { name: ky.ai.open })).toHaveCount(0);

  await page.getByLabel(ky.ai.placeholder).fill('Заказды кантип алам?');
  await page.getByRole('button', { name: ky.ai.send }).click();
  await expect(page.getByText(/Алып кетүү жайлары/)).toBeVisible();
});
