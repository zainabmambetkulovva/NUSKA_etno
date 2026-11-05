import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  sessionId: string;
  locale: string;
}
