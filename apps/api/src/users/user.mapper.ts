import { User } from '@prisma/client';

export type PublicUser = ReturnType<typeof toPublicUser>;

/** The only shape in which a user record leaves the API (never includes passwordHash). */
export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    locale: user.locale,
    emailVerified: user.emailVerifiedAt !== null,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}
