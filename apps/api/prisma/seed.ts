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
    priceSom: 110,
    type: ProductType.FOOD,
    categorySlugs: ['meat-products'],
  },
  {
    sku: 'KYMYZ',
    slug: 'kymyz',
    name: 'Кымыз',
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

    for (const locale of ['ru', 'ky'] as const) {
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId: record.id, locale } },
        update: {},
        create: { productId: record.id, locale, name: product.name },
      });
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

async function main() {
  console.log('🌱 Seeding database...');

  const categoryIds = await seedCategories();
  const catalog = await seedProducts(categoryIds);
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
