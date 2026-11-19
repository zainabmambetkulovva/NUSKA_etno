/**
 * Creates the first administrator, or promotes an existing user to ADMIN.
 *
 *   ADMIN_EMAIL=owner@example.com ADMIN_PASSWORD='…' ADMIN_FIRST_NAME='Name' pnpm admin:create
 *
 * An existing account keeps its password unless ADMIN_RESET_PASSWORD=true:
 * then its password becomes ADMIN_PASSWORD (also for accounts created with
 * Google) and its other sessions are signed out.
 *
 * Run it from your computer against the production database (DATABASE_URL),
 * then remove the password from your shell history.
 */
import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

function checkPassword(password: string) {
  if (
    password.length < 12 ||
    !/\p{L}/u.test(password) ||
    !/\d/.test(password) ||
    password.length > 72
  ) {
    throw new Error('ADMIN_PASSWORD must be 12–72 characters with letters and digits');
  }
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('Set ADMIN_EMAIL to a valid e-mail');

  const existing = await prisma.user.findUnique({ where: { email } });
  const resetPassword = process.env.ADMIN_RESET_PASSWORD === 'true';
  if (existing) {
    if (resetPassword) checkPassword(password);
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: UserRole.ADMIN,
        isActive: true,
        deletedAt: null,
        ...(resetPassword
          ? {
              passwordHash: await hash(password, Number(process.env.BCRYPT_ROUNDS) || 12),
              emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
            }
          : {}),
      },
    });
    if (resetPassword) await prisma.session.deleteMany({ where: { userId: existing.id } });
    console.log(
      resetPassword
        ? `✅ ${email} is an administrator; the password is now ADMIN_PASSWORD`
        : `✅ ${email} is now an administrator (password unchanged — tick «reset password» to set ADMIN_PASSWORD)`
    );
    return;
  }

  checkPassword(password);
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
