import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AppError } from '../../common/errors';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PrismaService } from '../../prisma/prisma.service';
import { ACCESS_COOKIE } from '../auth.cookies';
import { JwtPayload } from '../auth.service';

function fromCookie(request: Request): string | null {
  const token = request.cookies?.[ACCESS_COOKIE];
  return typeof token === 'string' && token.length > 0 ? token : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService
  ) {
    super({
      // The httpOnly cookie is the primary transport; the Bearer header is accepted for API tools.
      jwtFromRequest: ExtractJwt.fromExtractors([
        fromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  /**
   * The session and the user are re-checked on every request, so logout,
   * password reset, blocking and role changes take effect immediately.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload?.sub || !payload?.sid) {
      throw AppError.unauthorized('UNAUTHORIZED', 'Authentication required');
    }
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      select: {
        userId: true,
        expiresAt: true,
        user: { select: { id: true, role: true, locale: true, isActive: true, deletedAt: true } },
      },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.expiresAt <= new Date() ||
      !session.user.isActive ||
      session.user.deletedAt
    ) {
      throw AppError.unauthorized('UNAUTHORIZED', 'Authentication required');
    }
    return {
      id: session.user.id,
      role: session.user.role,
      locale: session.user.locale,
      sessionId: payload.sid,
    };
  }
}
