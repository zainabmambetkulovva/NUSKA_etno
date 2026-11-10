import { expect, test } from '@playwright/test';

import { expectNoHorizontalScroll, ky, ru } from './helpers';

test('header follows the brief: logo, menu, language, separate sign in and register', async ({
  page,
}) => {
  await page.goto('/ru');
  const header = page.locator('header');
  await expect(header.getByRole('link', { name: 'NUSKA_etno' })).toBeVisible();
  for (const name of [ru.nav.home, ru.nav.about, ru.nav.prices, ru.nav.contacts])
    await expect(header.getByRole('link', { name, exact: true })).toBeVisible();
  await expect(header.getByRole('group', { name: ru.nav.language })).toBeVisible();
  await expect(header.getByRole('link', { name: ru.nav.login, exact: true })).toHaveAttribute(
    'href',
    '/ru/login'
  );
  await expect(header.getByRole('link', { name: ru.nav.register, exact: true })).toHaveAttribute(
    'href',
    '/ru/register'
  );
  // No search, no empty cart.
  await expect(header.getByRole('searchbox')).toHaveCount(0);
  await expect(header.locator('a[href="/ru/cart"]')).toHaveCount(0);
});

test('stores are shown as an endless ticker on the pickup page', async ({ page }) => {
  await page.goto('/ky/pickup');
  const stores = page.locator('section[aria-labelledby="stores-title"]');
  await stores.scrollIntoViewIfNeeded();
  await expect(stores.getByText('Бимар').first()).toBeVisible();
});

test('home: why us, prices from the catalog, testimonials carousel and the footer', async ({
  page,
}) => {
  await page.goto('/ky');
  for (const title of [ky.home.whyTitle, ky.home.pricesTitle, ky.home.reviewsTitle])
    await expect(page.getByRole('heading', { name: title })).toBeAttached();

  // Prices come from the catalog: navat in three sizes, kymyz with its price.
  const prices = page.locator('section#prices');
  await prices.scrollIntoViewIfNeeded();
  await expect(prices.getByRole('heading', { name: 'Нават', level: 3 })).toBeVisible();
  for (const price of ['100 сом', '115 сом', '145 сом'])
    await expect(prices.getByText(price).first()).toBeVisible();
  await expect(prices.getByRole('link', { name: 'Кымыз' })).toBeVisible();

  // Testimonials: an endless carousel with arrows; samples are labelled.
  const reviews = page.locator('section#reviews');
  await reviews.scrollIntoViewIfNeeded();
  await expect(reviews.getByText('Айдана Теребаева').first()).toBeVisible();
  await reviews.getByRole('button', { name: ky.common.next }).click();
  await expect(reviews.getByText(ky.home.reviewsSampleNote)).toBeVisible();
  await expect(reviews.getByRole('link', { name: ky.home.reviewsAll })).toHaveAttribute(
    'href',
    '/ky/reviews'
  );

  // Footer: menu and the four socials.
  const footer = page.locator('footer');
  await expect(footer.getByRole('heading', { name: ky.footer.menu })).toBeVisible();
  for (const [name, href] of [
    ['Instagram', /instagram\.com\/nuska_etno$/],
    ['Telegram', /t\.me\/nuska_etnokatalog$/],
    ['WhatsApp', /wa\.me\/996701111024$/],
    ['YouTube', /youtube\.com\/@nuskaetno$/],
  ] as const)
    await expect(footer.getByRole('link', { name })).toHaveAttribute('href', href);
});

test('all testimonials page', async ({ page }) => {
  await page.goto('/ru/reviews');
  await expect(page.getByRole('heading', { level: 1, name: ru.home.reviewsTitle })).toBeVisible();
  await expect(page.getByText('Гүлнур Исмаилова')).toBeVisible();
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
