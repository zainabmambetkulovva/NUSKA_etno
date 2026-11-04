import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test categories
  const categories = [
    {
      slug: 'national-sweets',
      sortOrder: 1,
      isActive: true,
    },
    {
      slug: 'dairy-products',
      sortOrder: 2,
      isActive: true,
    },
    {
      slug: 'traditional-dishes',
      sortOrder: 3,
      isActive: true,
    },
    {
      slug: 'meat-products',
      sortOrder: 4,
      isActive: true,
    },
    {
      slug: 'natural-honey',
      sortOrder: 5,
      isActive: true,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        translations: {
          create: [
            {
              locale: 'ru',
              name: cat.slug.replace('-', ' '),
              description: `Категория ${cat.slug.replace('-', ' ')}`,
            },
            {
              locale: 'ky',
              name: cat.slug.replace('-', ''),
              description: `${cat.slug.replace('-', '')} тоби`,
            },
          ],
        },
      },
    });
  }

  console.log('✅ Categories seeded');

  // Create test products with prices from TZ
  const products = [
    {
      sku: 'NAVAT-05',
      slug: 'navat-0-5',
      type: 'FOOD',
      status: 'ACTIVE',
      priceAmount: 10000, // 100 som in tiyn
      currency: 'KGS',
      stockQuantity: 100,
      trackInventory: true,
      isFeatured: true,
      sortOrder: 1,
    },
    {
      sku: 'NAVAT-06',
      slug: 'navat-0-6',
      type: 'FOOD',
      status: 'ACTIVE',
      priceAmount: 11500, // 115 som in tiyn
      currency: 'KGS',
      stockQuantity: 80,
      trackInventory: true,
      isFeatured: true,
      sortOrder: 2,
    },
    {
      sku: 'NAVAT-07',
      slug: 'navat-0-7',
      type: 'FOOD',
      status: 'ACTIVE',
      priceAmount: 14500, // 145 som in tiyn
      currency: 'KGS',
      stockQuantity: 60,
      trackInventory: true,
      isFeatured: true,
      sortOrder: 3,
    },
    {
      sku: 'BESH-BARMAC',
      slug: 'besh-barmac',
      type: 'FOOD',
      status: 'ACTIVE',
      priceAmount: 9700, // 97 som in tiyn
      currency: 'KGS',
      stockQuantity: 50,
      trackInventory: true,
      isFeatured: false,
      sortOrder: 4,
    },
    {
      sku: 'KATTAMA',
      slug: 'kattama',
      type: 'FOOD',
      status: 'ACTIVE',
      priceAmount: 17000, // 170 som in tiyn
      currency: 'KGS',
      stockQuantity: 40,
      trackInventory: true,
      isFeatured: true,
      sortOrder: 5,
    },
    {
      sku: 'KEREMET-SHYPAA-CLASSIC',
      slug: 'keremet-shypaa-classic',
      type: 'FOOD',
      status: 'ACTIVE',
      priceAmount: 6500, // 65 som in tiyn
      currency: 'KGS',
      stockQuantity: 70,
      trackInventory: true,
      isFeatured: false,
      sortOrder: 6,
    },
    {
      sku: 'KEREMET-SHYPAA-CHYCHYRKANAK',
      slug: 'keremet-shypaa-chychyrkanak',
      type: 'FOOD',
      status: 'ACTIVE',
      priceAmount: 8500, // 85 som in tiyn
      currency: 'KGS',
      stockQuantity: 60,
      trackInventory: true,
      isFeatured: false,
      sortOrder: 7,
    },
    {
      sku: 'HOLADETS',
      slug: 'holadets',
      type: 'FOOD',
      status: 'ACTIVE',
      priceAmount: 11000, // 110 som in tiyn
      currency: 'KGS',
      stockQuantity: 30,
      trackInventory: true,
      isFeatured: false,
      sortOrder: 8,
    },
    {
      sku: 'KYMYZ',
      slug: 'kymyz',
      type: 'BEVERAGE',
      status: 'ACTIVE',
      priceAmount: 30000, // 300 som in tiyn
      currency: 'KGS',
      stockQuantity: 20,
      trackInventory: true,
      isFeatured: true,
      sortOrder: 9,
    },
    {
      sku: 'ZHUPKA',
      slug: 'zhupka',
      type: 'FOOD',
      status: 'ACTIVE',
      priceAmount: 8500, // 85 som in tiyn
      currency: 'KGS',
      stockQuantity: 45,
      trackInventory: true,
      isFeatured: false,
      sortOrder: 10,
    },
    {
      sku: 'SARY-MAY',
      slug: 'sary-may',
      type: 'FOOD',
      status: 'ACTIVE',
      priceAmount: 23500, // 235 som in tiyn
      currency: 'KGS',
      stockQuantity: 35,
      trackInventory: true,
      isFeatured: true,
      sortOrder: 11,
    },
    {
      sku: 'BAL',
      slug: 'bal',
      type: 'FOOD',
      status: 'ACTIVE',
      priceAmount: 23500, // 235 som in tiyn
      currency: 'KGS',
      stockQuantity: 25,
      trackInventory: true,
      isFeatured: true,
      sortOrder: 12,
    },
  ];

  for (const product of products) {
    const createdProduct = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        ...product,
        translations: {
          create: [
            {
              locale: 'ru',
              name: product.slug.replace(/-/g, ' '),
              shortDescription: `Натуральный кыргызский продукт ${product.slug.replace(/-/g, ' ')}`,
              description: `Премиальный натуральный кыргызский продукт ${product.slug.replace(/-/g, '')}.\n\nИзготовлен по традиционным рецептам с использованием натуральных ингредиентов.\n\nКачество, которое вы чувствуете в каждом bite.`,
              ingredients: 'Натуральные ингредиенты',
              storageInstructions: 'Хранить при температуре не выше +25°C и относительной влажности не более 75%',
            },
            {
              locale: 'ky',
              name: product.slug.replace(/-/g, ' '),
              shortDescription: `Кыргыздин натуралдык продукту ${product.slug.replace(/-/g, ' ')}`,
              description: `Premium天然的 кыргыз продукту ${product.slug.replace(/-/g, '')}.\n\nАнанын традициялары боюнча жасалган, натуралдык заттардан даярдалган.\n\nАр бир biteде сезип көрө турган сапат.`,
              ingredients: 'Натуралдык заттар',
              storageInstructions: 'Температура +25°C жогору эмес жана суюктук 75% чактыгында сактоо',
            },
          ],
        },
        units: {
          create: [
            {
              unitName: 'Штука',
              quantityValue: 1,
              quantityUnit: 'шт',
            },
          ],
        },
      },
    });

    console.log(`✅ Product created: ${createdProduct.sku}`);
  }

  console.log('✅ Products seeded');

  // Create pickup locations
  const pickupLocations = [
    {
      name: 'NUSKA_etno — Главная точка',
      address: 'г. Бишкек, ул. Алиева, 123',
      description: 'Основная точка самовывоза. Работаем с 9:00 до 20:00.',
      phone: '+996 555 123 456',
      isActive: true,
    },
  ];

  for (const loc of pickupLocations) {
    await prisma.pickupLocation.upsert({
      where: { name: loc.name },
      update: {},
      create: {
        ...loc,
      },
    });
  }

  console.log('✅ Pickup locations seeded');

  // Create test user (admin)
  const passwordHash = await hash('Admin123!', BCRYPT_ROUNDS);
  const user = await prisma.user.upsert({
    where: { email: 'admin@nuska.kg' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'Adminov',
      email: 'admin@nuska.kg',
      phone: '+996555000000',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', user.email);

  // Create test user (customer)
  const customerPasswordHash = await hash('Customer123!', BCRYPT_ROUNDS);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@nuska.kg' },
    update: {},
    create: {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'customer@nuska.kg',
      phone: '+996555111111',
      passwordHash: customerPasswordHash,
      role: 'USER',
      isActive: true,
    },
  });

  console.log('✅ Customer user created:', customer.email);

  console.log('🌱 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
