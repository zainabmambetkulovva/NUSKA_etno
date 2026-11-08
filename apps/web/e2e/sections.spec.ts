import { expect, test } from '@playwright/test';

import { expectNoHorizontalScroll, ky, ru } from './helpers';

test('header follows the design: logo, menu, search, sign in / register', async ({ page }) => {
  await page.goto('/ru');
  const header = page.locator('header');
  await expect(header.getByRole('link', { name: 'NUSKA_etno' })).toBeVisible();
  await expect(header.getByRole('searchbox')).toHaveCount(0);
  await expect(header.getByRole('link', { name: ru.nav.search })).toBeVisible();
  await expect(
    header.getByRole('link', { name: new RegExp(`${ru.nav.login}.*${ru.nav.register}`) })
  ).toHaveAttribute('href', '/ru/login');
  for (const name of [ru.nav.home, ru.nav.about, ru.nav.pickup, ru.nav.reviews, ru.nav.contacts])
    await expect(header.getByRole('link', { name, exact: true })).toBeVisible();
});

test('stores are shown as an endless ticker on the pickup page', async ({ page }) => {
  await page.goto('/ky/pickup');
  const stores = page.locator('section[aria-labelledby="stores-title"]');
  await stores.scrollIntoViewIfNeeded();
  await expect(stores.getByText('Бимар').first()).toBeVisible();
});

test('catalog mega menu shows the categories', async ({ page }) => {
  await page.goto('/ru');
  await page.getByRole('button', { name: ru.nav.catalog, exact: true }).click();
  const allCatalog = page.locator('header').getByRole('link', { name: ru.nav.goToCatalog });
  await expect(allCatalog).toBeVisible();
  await expect(page.getByRole('link', { name: /Молочные продукты/ }).first()).toBeVisible();
  await expect(page.locator('header').getByRole('link', { name: ru.nav.giftSets })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(allCatalog).toBeHidden();
});

test('home follows the design: products, why us, story, reviews, gifts and newsletter', async ({
  page,
}) => {
  await page.goto('/ky');
  for (const title of [
    ky.home.productsTitle,
    ky.home.whyTitle,
    ky.home.storyTitle,
    ky.home.reviewsTitle,
    ky.home.giftTitle,
    ky.newsletter.title,
  ]) {
    await expect(page.getByRole('heading', { name: title })).toBeAttached();
  }
  // The six signature products, each opening the product (or the search for it).
  const products = page.locator('section[aria-labelledby="products-title"]');
  for (const name of ['Сары май', 'Жупка', 'Бешбармак', 'Кымыз', 'Нават', 'Курут'])
    await expect(products.getByRole('link', { name: new RegExp(name) })).toBeVisible();
  await products.getByRole('link', { name: /Кымыз/ }).click();
  await expect(page).toHaveURL(/\/ky\/product\/kymyz$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Кымыз' })).toBeVisible();
  await page.goBack();

  // Footer: navigation and contacts columns, order links and socials.
  const footer = page.locator('footer');
  for (const title of [ky.footer.navigation, ky.footer.contacts]) {
    await expect(footer.getByRole('heading', { name: title })).toBeVisible();
  }
  await expect(footer.getByRole('link', { name: ky.footer.wholesale })).toHaveAttribute(
    'href',
    /^https:\/\//
  );
  await expect(footer.getByRole('link', { name: ky.footer.retail })).toHaveAttribute(
    'href',
    /^https:\/\//
  );
  await expect(footer.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
    'href',
    /instagram\.com\//
  );
});

test('FAQ page: search and category filter', async ({ page }) => {
  await page.goto('/ru/faq');
  await expect(page.getByRole('heading', { level: 1, name: ru.faq.title })).toBeVisible();
  const questions = page.locator('li h3 button');
  await expect(questions.first()).toBeVisible();
  const total = await questions.count();
  await page.getByRole('searchbox', { name: ru.faq.searchPlaceholder }).fill('регистрация');
  await expect(questions).toHaveCount(1);
  await questions.first().click();
  await expect(page.getByText(/после входа в аккаунт/)).toBeVisible();
  await page.getByRole('searchbox', { name: ru.faq.searchPlaceholder }).fill('');
  await page.getByRole('button', { name: ru.faq.categories.pickup }).click();
  await expect(questions).not.toHaveCount(total);
});

test('newsletter: consent is required, then the subscription is accepted', async ({ page }) => {
  await page.goto('/ru');
  const form = page.locator('form').filter({ has: page.getByLabel(ru.newsletter.email) });
  await form.getByLabel(ru.newsletter.email).fill(`e2e-${Date.now()}@example.com`);
  await form.getByRole('button', { name: ru.newsletter.submit }).click();
  await expect(form.getByRole('alert')).toContainText(ru.newsletter.consentRequired);
  await form.getByLabel(ru.newsletter.consent).check();
  await form.getByRole('button', { name: ru.newsletter.submit }).click();
  await expect(page.getByRole('status').filter({ hasText: ru.newsletter.done })).toBeVisible();
});

test('search page finds products and shows suggestions', async ({ page }) => {
  await page.goto('/ky/search?q=%D0%BD%D0%B0%D0%B2%D0%B0%D1%82');
  await expect(page.getByText(new RegExp(ky.search.results))).toBeVisible();
  await expect(page.locator('main').getByRole('link', { name: /Нават/ }).first()).toBeVisible();

  const box = page.getByRole('searchbox', { name: ky.search.title });
  await box.fill('кымы');
  await expect(page.getByRole('list', { name: ky.search.suggestions })).toBeVisible();
  await box.fill('zzzzqqq');
  await box.press('Enter');
  await expect(page.getByText(ky.search.empty)).toBeVisible();
});

test('legal pages show an honest notice until the company publishes the text', async ({ page }) => {
  await page.goto('/ru/privacy');
  await expect(page.getByText(ru.pages.pendingText)).toBeVisible();
  await page.goto('/ky/traditions');
  await expect(
    page.getByRole('heading', { level: 1, name: ky.pages.traditions.title })
  ).toBeVisible();
});

for (const width of [1024, 1280, 1366]) {
  test(`no horizontal scrolling at ${width}px (Kyrgyz labels are the longest)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/ky');
    await expectNoHorizontalScroll(page);
  });
}
