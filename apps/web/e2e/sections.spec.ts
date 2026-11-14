import { expect, test } from '@playwright/test';

import { expectNoHorizontalScroll, ky, ru } from './helpers';

test('header follows the mockup: catalog menu, pages, language, search, favorites, cart, account', async ({
  page,
}) => {
  await page.goto('/ru');
  const header = page.locator('header');
  await expect(header.getByRole('link', { name: 'NUSKA_etno' })).toBeVisible();
  for (const [name, href] of [
    [ru.nav.brand, '/ru/about'],
    [ru.nav.delivery, '/ru/delivery'],
    [ru.nav.recipes, '/ru/recipes'],
    [ru.nav.contacts, '/ru/contacts'],
  ])
    await expect(header.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  // the catalog menu lists the real categories
  await header.getByRole('button', { name: ru.nav.catalog }).click();
  await expect(header.getByRole('link', { name: ru.nav.allProducts })).toHaveAttribute(
    'href',
    '/ru/catalog'
  );
  await expect(header.getByRole('link', { name: 'Молочные продукты' })).toHaveAttribute(
    'href',
    '/ru/catalog/dairy-products'
  );
  await expect(header.getByRole('link', { name: ru.nav.search })).toHaveAttribute(
    'href',
    '/ru/search'
  );
  await expect(header.getByRole('link', { name: ru.nav.favorites })).toHaveAttribute(
    'href',
    '/ru/account/favorites'
  );
  await expect(header.locator('a[href="/ru/cart"]')).toBeVisible();
  // account: sign in and register
  await header.getByRole('button', { name: ru.nav.account }).click();
  await expect(header.getByRole('menuitem', { name: ru.nav.login })).toHaveAttribute(
    'href',
    '/ru/login'
  );
  await expect(header.getByRole('menuitem', { name: ru.nav.register })).toHaveAttribute(
    'href',
    '/ru/register'
  );
  // language: KG / RU
  await header.getByRole('button', { name: ru.nav.language }).click();
  await expect(header.getByRole('menuitem', { name: /Кыргызча/ })).toHaveAttribute('href', '/ky');
});

test('new pages of the header open: delivery and payment, recipes, origin map', async ({
  page,
}) => {
  await page.goto('/ru/delivery');
  await expect(page.getByRole('heading', { level: 1, name: ru.deliveryPage.title })).toBeVisible();
  await page.goto('/ru/recipes');
  await expect(page.getByRole('heading', { level: 1, name: ru.recipesPage.title })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Бешбармак' })).toBeVisible();
  await page.goto('/ru/origin');
  await page.getByRole('button', { name: 'Таласская область' }).click();
  await expect(page.getByRole('heading', { name: 'Таласская область' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Жупка' }).first()).toHaveAttribute(
    'href',
    '/ru/product/zhupka'
  );
});

test('stores are shown as an endless ticker on the pickup page', async ({ page }) => {
  await page.goto('/ky/pickup');
  const stores = page.locator('section[aria-labelledby="stores-title"]');
  await stores.scrollIntoViewIfNeeded();
  await expect(stores.getByText('Бимар').first()).toBeVisible();
});

test('home follows the mockup and keeps the earlier blocks: categories, origin, bestsellers, prices, footer', async ({
  page,
}) => {
  await page.goto('/ky');
  for (const title of [
    ky.landing.productsTitle,
    ky.landing.aboutTitle,
    ky.landing.originTitle,
    ky.landing.bestTitle,
    ky.home.whyTitle,
    ky.home.pricesTitle,
    ky.home.storyTitle,
    ky.home.productsTitle,
    ky.home.ctaTitle,
  ])
    await expect(page.getByRole('heading', { name: title })).toBeAttached();

  // The plates on the podium carry the catalog prices and open the product.
  const prices = page.locator('section#prices');
  await prices.scrollIntoViewIfNeeded();
  await expect(prices.getByRole('link', { name: /Сары май\s*235 сом/ })).toBeVisible();
  await expect(prices.getByRole('link', { name: /Нават\s*100 сомдон/ })).toBeVisible();
  await prices.getByRole('link', { name: /Кымыз\s*300 сом/ }).click();
  await expect(page).toHaveURL(/\/ky\/product\/kymyz$/);
  await page.goBack();

  // Product cards open the products.
  const products = page.locator('section[aria-labelledby="products-title"]');
  await expect(products.getByRole('link', { name: /Жупка/ })).toHaveAttribute(
    'href',
    '/ky/product/zhupka'
  );
  await expect(page.getByRole('link', { name: ky.home.ctaButton })).toHaveAttribute(
    'href',
    '/ky/catalog'
  );

  // Category arches open the categories; bestsellers come from the catalog.
  await expect(
    page
      .locator('section[aria-labelledby="categories-title"]')
      .getByRole('link', { name: /Сүт азыктары/ })
  ).toHaveAttribute('href', '/ky/catalog/dairy-products');
  await expect(
    page.getByRole('region', { name: ky.landing.bestTitle }).getByRole('link', { name: 'Кымыз' })
  ).toHaveAttribute('href', '/ky/product/kymyz');

  // Footer: catalog, company, help, newsletter, socials and the back to top button.
  const footer = page.locator('footer');
  for (const name of [ky.footer.catalog, ky.footer.company, ky.footer.help, ky.newsletter.title])
    await expect(footer.getByRole('heading', { name, exact: true })).toBeVisible();
  await expect(footer.getByRole('link', { name: ky.nav.delivery })).toHaveAttribute(
    'href',
    '/ky/delivery'
  );
  await expect(footer.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
    'href',
    /wa\.me\/996701111024$/
  );
  await expect(footer.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
    'href',
    /instagram\.com\/nuska_etno$/
  );
  await expect(footer.getByRole('link', { name: 'YouTube' }).first()).toHaveAttribute(
    'href',
    /^https:\/\/(www\.)?youtube\.com\//
  );
  // the fixed button above the AI button, shown once the page is scrolled
  await page.getByRole('button', { name: ky.footer.backToTop }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(50);
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
