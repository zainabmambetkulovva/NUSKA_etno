import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { AppError } from '../../common/errors';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

/** Global guard: enforces @Roles(...) using the role loaded from the database. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const user = context.switchToHttp().getRequest<Request>().user as AuthenticatedUser | undefined;
    if (!user || !requiredRoles.includes(user.role)) {
      throw AppError.forbidden('FORBIDDEN', 'Insufficient permissions');
    }
    return true;
  }
}
