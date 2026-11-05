/**
 * Creates the first administrator, or promotes an existing user to ADMIN.
 *
 *   ADMIN_EMAIL=owner@example.com ADMIN_PASSWORD='…' ADMIN_FIRST_NAME='Name' pnpm admin:create
 *
 * Run it from your computer against the production database (DATABASE_URL),
 * then remove the password from your shell history.
 */
import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('Set ADMIN_EMAIL to a valid e-mail');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: UserRole.ADMIN, isActive: true, deletedAt: null },
    });
    console.log(`✅ ${email} is now an administrator (password unchanged)`);
    return;
  }

  if (
    password.length < 12 ||
    !/\p{L}/u.test(password) ||
    !/\d/.test(password) ||
    password.length > 72
  ) {
    throw new Error('ADMIN_PASSWORD must be 12–72 characters with letters and digits');
  }
  await prisma.user.create({
    data: {
      email,
      passwordHash: await hash(password, Number(process.env.BCRYPT_ROUNDS) || 12),
      role: UserRole.ADMIN,
      firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Administrator created: ${email}`);
}

main()
  .catch((error) => {
    console.error('❌', (error as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
