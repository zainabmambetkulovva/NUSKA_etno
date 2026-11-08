/**
 * NUSKA_etno — development / demo seed.
 *
 * Rules (TZ §6.2, §26, DATABASE.md §20):
 * - Prices come from the company's initial price list.
 * - Nothing the company has not provided is invented: no weights, volumes
 *   (except Нават 0.5 / 0.6 / 0.7 л, confirmed by the company),
 *   ingredients, storage conditions, descriptions, stock levels, addresses,
 *   phone numbers or opening hours. Such fields stay empty.
 * - The pickup location is explicitly marked as DEMO.
 * - Demo account passwords come from env or are generated randomly.
 * - Kyrgyz category names must be reviewed by an editor before production.
 *
 * The seed is idempotent: running it again does not create duplicates.
 */
import { randomBytes } from 'node:crypto';

import {
  OrderStatus,
  PackagingModel,
  Prisma,
  PrismaClient,
  ProductStatus,
  ProductType,
  UserRole,
} from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

const SOM = 100; // prices are stored in tyiyn
const DEMO_MARK = '[DEMO]';

type Locale = 'ru' | 'ky';
type LocalizedName = Record<Locale, string>;

// ---------------------------------------------------------------------------
// Categories (TZ §6.1)
// ---------------------------------------------------------------------------

const categories: { slug: string; sortOrder: number; name: LocalizedName }[] = [
  {
    slug: 'national-sweets',
    sortOrder: 1,
    name: { ru: 'Национальные сладости', ky: 'Улуттук таттуулар' },
  },
  {
    slug: 'dairy-products',
    sortOrder: 2,
    name: { ru: 'Молочные продукты', ky: 'Сүт азыктары' },
  },
  {
    slug: 'traditional-dishes',
    sortOrder: 3,
    name: { ru: 'Традиционные блюда', ky: 'Салттуу тамактар' },
  },
  {
    slug: 'meat-products',
    sortOrder: 4,
    name: { ru: 'Мясные продукты', ky: 'Эт азыктары' },
  },
  {
    slug: 'natural-honey',
    sortOrder: 5,
    name: { ru: 'Натуральный мёд', ky: 'Табигый бал' },
  },
];

// ---------------------------------------------------------------------------
// Products: initial price list (TZ §6.2). Names are used exactly as in the
// price list for both locales until the company provides translations.
// Category links are a starting point and must be confirmed by the company;
// "Керемет шыпаа" is left without a category until its kind is known.
// ---------------------------------------------------------------------------

const products: {
  sku: string;
  slug: string;
  name: string;
  priceSom: number;
  type: ProductType;
  categorySlugs: string[];
  /** Name per locale when it differs from the price list (provided by the company). */
  localizedName?: Partial<Record<Locale, string>>;
  /** Short descriptions taken from the company's own materials (labels, posts). */
  shortDescription?: Partial<Record<Locale, string>>;
  /** Volume in litres, confirmed by the company (Нават 0.5 / 0.6 / 0.7 л). */
  volumeLiters?: number;
}[] = [
  {
    sku: 'NAVAT-0.5',
    slug: 'navat-0-5',
    name: 'Нават 0.5',
    priceSom: 100,
    type: ProductType.FOOD,
    categorySlugs: ['national-sweets'],

    volumeLiters: 0.5,
  },
  {
    sku: 'NAVAT-0.6',
    slug: 'navat-0-6',
    name: 'Нават 0.6',
    priceSom: 115,
    type: ProductType.FOOD,
    categorySlugs: ['national-sweets'],

    volumeLiters: 0.6,
  },
  {
    sku: 'NAVAT-0.7',
    slug: 'navat-0-7',
    name: 'Нават 0.7',
    priceSom: 145,
    type: ProductType.FOOD,
    categorySlugs: ['national-sweets'],

    volumeLiters: 0.7,
  },
  {
    sku: 'BESH-BARMAK',
    slug: 'besh-barmak',
    name: 'Беш бармак',
    priceSom: 97,
    type: ProductType.FOOD,
    categorySlugs: ['traditional-dishes'],
  },
  {
    sku: 'KATTAMA',
    slug: 'kattama',
    name: 'Каттама',
    priceSom: 170,
    type: ProductType.FOOD,
    categorySlugs: ['traditional-dishes'],
  },
  {
    sku: 'KEREMET-SHYPAA-CLASSIC',
    slug: 'keremet-shypaa-klassika',
    name: 'Керемет шыпаа — классика',
    priceSom: 65,
    type: ProductType.FOOD,
    categorySlugs: [],
  },
  {
    sku: 'KEREMET-SHYPAA-CHYCHYRKANAK',
    slug: 'keremet-shypaa-chychyrkanak',
    name: 'Керемет шыпаа — чычырканак менен',
    priceSom: 85,
    type: ProductType.FOOD,
    categorySlugs: [],
  },
  {
    sku: 'KHOLODETS',
    slug: 'kholodets',
    name: 'Холодец',
    // Kyrgyz name used by the company (Instagram highlight "Килкилдек (холодец)").
    localizedName: { ky: 'Килкилдек' },
    priceSom: 110,
    type: ProductType.FOOD,
    categorySlugs: ['meat-products'],
  },
  {
    sku: 'KYMYZ',
    slug: 'kymyz',
    name: 'Кымыз',
    // Company's own text from its Instagram post; no Russian version was provided.
    shortDescription: { ky: 'Табигый, жеңил сиңүүчү, дарылык касиети бар азык катары бааланат.' },
    priceSom: 300,
    type: ProductType.BEVERAGE,
    categorySlugs: ['dairy-products'],
  },
  {
    sku: 'ZHUPKA',
    slug: 'zhupka',
    name: 'Жупка',
    priceSom: 85,
    type: ProductType.FOOD,
    categorySlugs: ['traditional-dishes'],
  },
  {
    sku: 'SARY-MAI',
    slug: 'sary-mai',
    name: 'Сары май',
    // From the product label: "Сары май — Топлёное масло".
    shortDescription: { ru: 'Топлёное масло' },
    priceSom: 235,
    type: ProductType.FOOD,
    categorySlugs: ['dairy-products'],
  },
  {
    sku: 'BAL',
    slug: 'bal',
    name: 'Бал',
    priceSom: 235,
    type: ProductType.FOOD,
    categorySlugs: ['natural-honey'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generatePassword(): string {
  return randomBytes(12).toString('base64url');
}

async function seedCategories() {
  const ids = new Map<string, string>();

  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: { slug: category.slug, sortOrder: category.sortOrder, isActive: true },
    });

    for (const locale of ['ru', 'ky'] as const) {
      await prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: record.id, locale } },
        update: {},
        create: { categoryId: record.id, locale, name: category.name[locale] },
      });
    }

    ids.set(category.slug, record.id);
  }

  console.log(`✅ Categories: ${ids.size}`);
  return ids;
}

/**
 * 3D packaging for the product page, only where the company's photos show the
 * real package (Instagram): kymyz bottle, navat box, sary may jar, beshbarmak pack.
 */
const PACKAGING_3D: Record<string, PackagingModel> = {
  KYMYZ: PackagingModel.BOTTLE,
  'NAVAT-0.5': PackagingModel.BOX,
  'NAVAT-0.6': PackagingModel.BOX,
  'NAVAT-0.7': PackagingModel.BOX,
  'SARY-MAI': PackagingModel.JAR,
  'BESH-BARMAK': PackagingModel.PACK,
};

async function seedProducts(categoryIds: Map<string, string>) {
  const records = new Map<string, { id: string; sku: string; name: string; priceAmount: number }>();

  for (const [index, product] of products.entries()) {
    const record = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        sku: product.sku,
        slug: product.slug,
        type: product.type,
        status: ProductStatus.ACTIVE,
        priceAmount: product.priceSom * SOM,
        currency: 'KGS',
        // Real stock levels are not known yet (TZ §26). Inventory tracking is
        // switched on per product in the admin panel once stock is entered.
        stockQuantity: 0,
        trackInventory: false,
        isFeatured: false,
        sortOrder: index + 1,
      },
    });

    // Filled in once; a choice made later in the admin panel is kept.
    const packaging = PACKAGING_3D[product.sku];
    if (packaging && record.packaging3d === null) {
      await prisma.product.update({ where: { id: record.id }, data: { packaging3d: packaging } });
    }

    for (const locale of ['ru', 'ky'] as const) {
      const name = product.localizedName?.[locale] ?? product.name;
      const shortDescription = product.shortDescription?.[locale] ?? null;
      const existing = await prisma.productTranslation.findUnique({
        where: { productId_locale: { productId: record.id, locale } },
      });
      if (!existing) {
        await prisma.productTranslation.create({
          data: { productId: record.id, locale, name, shortDescription },
        });
      } else {
        // Re-running the seed fills in company-provided data but never overwrites edits made in the admin panel.
        await prisma.productTranslation.update({
          where: { id: existing.id },
          data: {
            ...(existing.name === product.name && name !== product.name ? { name } : {}),
            ...(existing.shortDescription === null && shortDescription ? { shortDescription } : {}),
          },
        });
      }
    }

    if (product.volumeLiters) {
      // "Литр" / "л" is the same word in Kyrgyz and Russian.
      const hasUnit = await prisma.productUnit.count({ where: { productId: record.id } });
      if (!hasUnit) {
        await prisma.productUnit.create({
          data: {
            productId: record.id,
            unitName: 'Литр',
            quantityValue: product.volumeLiters,
            quantityUnit: 'л',
          },
        });
      }
    }

    for (const slug of product.categorySlugs) {
      const categoryId = categoryIds.get(slug);
      if (!categoryId) throw new Error(`Unknown category slug: ${slug}`);
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: record.id, categoryId } },
        update: {},
        create: { productId: record.id, categoryId },
      });
    }

    records.set(product.sku, {
      id: record.id,
      sku: record.sku,
      name: product.name,
      priceAmount: record.priceAmount,
    });
  }

  console.log(`✅ Products: ${records.size}`);
  return records;
}

async function seedPickupLocation() {
  const name = `${DEMO_MARK} Точка самовывоза`;
  const existing = await prisma.pickupLocation.findFirst({ where: { name } });
  if (existing) return existing;

  const location = await prisma.pickupLocation.create({
    data: {
      name,
      address: `${DEMO_MARK} Адрес будет предоставлен компанией`,
      description: 'Демонстрационные данные для разработки. Заменить реальными перед запуском.',
      isActive: true,
      sortOrder: 1,
    },
  });
  console.log('✅ Pickup location (demo) created');
  return location;
}

async function seedUser(params: {
  email: string;
  password: string | undefined;
  role: UserRole;
  firstName: string;
  lastName: string;
}) {
  const email = params.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ️  User exists, left unchanged: ${email}`);
    return existing;
  }

  const password = params.password || generatePassword();
  const rounds = Number(process.env.BCRYPT_ROUNDS) || 12;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hash(password, rounds),
      role: params.role,
      firstName: params.firstName,
      lastName: params.lastName,
      emailVerifiedAt: new Date(),
    },
  });

  if (params.password) {
    console.log(`✅ ${params.role} created: ${email} (password from env)`);
  } else {
    console.log(`✅ ${params.role} created: ${email} / generated password: ${password}`);
    console.log('   Save it now — it is not stored anywhere in plain text.');
  }
  return user;
}

async function seedDemoOrders(
  customer: { id: string; firstName: string | null; lastName: string | null; email: string },
  pickup: { id: string; name: string; address: string },
  catalog: Map<string, { id: string; sku: string; name: string; priceAmount: number }>
) {
  const existing = await prisma.order.count({ where: { userId: customer.id } });
  if (existing > 0) {
    console.log('ℹ️  Demo orders already exist, skipped');
    return;
  }

  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const demoOrders: {
    items: { sku: string; quantity: number }[];
    path: OrderStatus[];
    createdAt: Date;
    comment?: string;
  }[] = [
    {
      items: [
        { sku: 'NAVAT-0.5', quantity: 2 },
        { sku: 'KYMYZ', quantity: 1 },
      ],
      path: [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY_FOR_PICKUP,
        OrderStatus.COMPLETED,
      ],
      createdAt: new Date(now - 7 * day),
    },
    {
      items: [{ sku: 'SARY-MAI', quantity: 1 }],
      path: [OrderStatus.PENDING, OrderStatus.CANCELLED],
      createdAt: new Date(now - 3 * day),
      comment: `${DEMO_MARK} Отменён покупателем`,
    },
    {
      items: [
        { sku: 'BAL', quantity: 1 },
        { sku: 'KATTAMA', quantity: 2 },
      ],
      path: [OrderStatus.PENDING],
      createdAt: new Date(now - 1 * day),
    },
  ];

  const customerName =
    [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email;

  for (const demo of demoOrders) {
    const items = demo.items.map(({ sku, quantity }) => {
      const product = catalog.get(sku);
      if (!product) throw new Error(`Unknown SKU in demo order: ${sku}`);
      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity,
        unitPriceAmount: product.priceAmount,
        totalPriceAmount: product.priceAmount * quantity,
      };
    });
    const subtotal = items.reduce((sum, item) => sum + item.totalPriceAmount, 0);
    const finalStatus = demo.path[demo.path.length - 1];
    const stepTime = (step: number) => new Date(demo.createdAt.getTime() + step * 60 * 60 * 1000);

    const history: Prisma.OrderStatusHistoryCreateWithoutOrderInput[] = demo.path.map(
      (status, step) => ({
        oldStatus: step === 0 ? null : demo.path[step - 1],
        newStatus: status,
        createdAt: stepTime(step),
      })
    );

    await prisma.order.create({
      data: {
        userId: customer.id,
        status: finalStatus,
        subtotalAmount: subtotal,
        totalAmount: subtotal,
        currency: 'KGS',
        locale: 'ky',
        customerName,
        customerPhone: '+996000000001', // fictitious demo number
        customerEmail: customer.email,
        pickupLocationId: pickup.id,
        pickupLocationName: pickup.name,
        pickupLocationAddress: pickup.address,
        customerComment: demo.comment,
        createdAt: demo.createdAt,
        confirmedAt: demo.path.includes(OrderStatus.CONFIRMED) ? stepTime(1) : null,
        completedAt: finalStatus === OrderStatus.COMPLETED ? stepTime(demo.path.length - 1) : null,
        cancelledAt: finalStatus === OrderStatus.CANCELLED ? stepTime(demo.path.length - 1) : null,
        items: { create: items },
        statusHistory: { create: history },
      },
    });
  }

  console.log(`✅ Demo orders: ${demoOrders.length}`);
}

// ---------------------------------------------------------------------------
// Site content provided by the company (Instagram profile and stories).
// Created only if missing, so later edits in the admin panel are kept.
// ---------------------------------------------------------------------------

const SITE_CONTENT: {
  key: string;
  data?: Record<string, unknown>;
  translations: { locale: Locale; title?: string; body?: string }[];
}[] = [
  {
    key: 'contacts',
    data: {
      whatsapp: '+996701111024',
      instagram: 'nuska_etno',
      telegram: 'nuska_etnokatalog',
      address: 'Бишкек, Кыргызстан',
      wholesale: 'https://project23274583.tilda.ws/nuska_etno',
      retail: 'https://project23274583.tilda.ws/nuska_etno0',
    },
    translations: [
      {
        locale: 'ky',
        title: 'Байланыш',
        body: 'NUSKA ETNO — улуттук азыктардын өндүрүүчүсү.\nДүң жана чекене сатуу. Кызматташууга ачыкпыз.',
      },
      {
        // Translation of the company's Kyrgyz profile text; to be reviewed by the company.
        locale: 'ru',
        title: 'Контакты',
        body: 'NUSKA ETNO — производитель национальных продуктов.\nОптовая и розничная продажа. Открыты к сотрудничеству.',
      },
    ],
  },
  {
    key: 'stores',
    data: {
      city: 'Бишкек',
      stores: [
        'Бимар',
        'Метро',
        'Шекер',
        'Элиме',
        'Реалист',
        'Кампа',
        'Магнат',
        'Босого',
        'Арча',
        'Береке',
        'Арзан сити',
        'Эконом',
        'Продуктошка',
        'Данек',
        'Венеция',
        'Асылбаш',
        'Ак-Орго',
      ],
    },
    translations: [
      { locale: 'ky', title: 'Биздин азыктарды Бишкек шаарынын дүкөндөрүнөн да табасыз' },
      { locale: 'ru', title: 'Наши продукты также продаются в магазинах Бишкека' },
    ],
  },
];

async function seedSiteContent() {
  for (const block of SITE_CONTENT) {
    const exists = await prisma.siteContent.findUnique({ where: { key: block.key } });
    if (exists) continue;
    await prisma.siteContent.create({
      data: {
        key: block.key,
        data: block.data as Prisma.InputJsonValue | undefined,
        translations: {
          create: block.translations.map((t) => ({
            locale: t.locale,
            title: t.title ?? null,
            body: t.body ?? null,
          })),
        },
      },
    });
  }
  console.log(`✅ Site content: ${SITE_CONTENT.map((b) => b.key).join(', ')}`);
}

// FAQ: only how the website works (no payment, return or delivery terms —
// those are added by the company in the admin panel). Seeded only when empty.
const FAQ: { category: string; ky: [string, string]; ru: [string, string] }[] = [
  {
    category: 'orders',
    ky: [
      'Заказды кантип берем?',
      'Азыктарды себетке салыңыз, аккаунтка кириңиз же катталыңыз, өзүңүз алып кетүүчү жерди тандап, заказды ырастаңыз.',
    ],
    ru: [
      'Как оформить заказ?',
      'Добавьте товары в корзину, войдите или зарегистрируйтесь, выберите пункт самовывоза и подтвердите заказ.',
    ],
  },
  {
    category: 'account',
    ky: [
      'Заказ берүү үчүн катталуу керекпи?',
      'Ооба, заказ аккаунтка киргенден кийин гана берилет. Кирүүгө чейин себетке салган азыктарыңыз сакталат.',
    ],
    ru: [
      'Нужна ли регистрация для заказа?',
      'Да, заказ оформляется после входа в аккаунт. Товары, добавленные в корзину до входа, сохранятся.',
    ],
  },
  {
    category: 'orders',
    ky: [
      'Заказдын абалын кайдан көрөм?',
      'Жеке кабинеттеги «Менин заказдарым» бөлүмүнөн. Абалы өзгөргөндө билдирүү келет.',
    ],
    ru: [
      'Где посмотреть статус заказа?',
      'В личном кабинете, в разделе «Мои заказы». При изменении статуса вы получите уведомление.',
    ],
  },
  {
    category: 'pickup',
    ky: [
      'Заказды качан алып кетсем болот?',
      'Заказдын абалы «Алып кетүүгө даяр» болгондо, тандалган жерге келиңиз.',
    ],
    ru: [
      'Когда можно забрать заказ?',
      'Когда статус заказа станет «Готов к выдаче», приходите в выбранный пункт самовывоза.',
    ],
  },
];

async function seedFaq() {
  if ((await prisma.faqItem.count()) > 0) return;
  for (const [i, item] of FAQ.entries()) {
    await prisma.faqItem.create({
      data: {
        category: item.category,
        sortOrder: i,
        translations: {
          create: [
            { locale: 'ky', question: item.ky[0], answer: item.ky[1] },
            { locale: 'ru', question: item.ru[0], answer: item.ru[1] },
          ],
        },
      },
    });
  }
  console.log(`✅ FAQ: ${FAQ.length} questions`);
}

// ---------------------------------------------------------------------------

async function main() {
  // Production: SEED_DEMO=false loads only the catalog and site content.
  // No demo pickup point, users or orders are created (create the admin with `pnpm admin:create`).
  const demo =
    (process.env.SEED_DEMO ?? (process.env.NODE_ENV === 'production' ? 'false' : 'true')) ===
    'true';
  console.log(`🌱 Seeding database (${demo ? 'with demo data' : 'catalog and content only'})...`);

  const categoryIds = await seedCategories();
  const catalog = await seedProducts(categoryIds);
  await seedSiteContent();
  await seedFaq();

  if (demo) {
    const pickup = await seedPickupLocation();
    await seedUser({
      email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.SEED_ADMIN_PASSWORD,
      role: UserRole.ADMIN,
      firstName: 'Demo',
      lastName: 'Admin',
    });
    const customer = await seedUser({
      email: process.env.SEED_CUSTOMER_EMAIL || 'customer@example.com',
      password: process.env.SEED_CUSTOMER_PASSWORD,
      role: UserRole.USER,
      firstName: 'Demo',
      lastName: 'Customer',
    });
    await seedDemoOrders(customer, pickup, catalog);
  }

  console.log('🌱 Seed completed');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
