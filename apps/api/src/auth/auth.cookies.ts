import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';

import { IssuedTokens } from './auth.service';

export const ACCESS_COOKIE = 'nuska_access';
export const REFRESH_COOKIE = 'nuska_refresh';
/** The refresh cookie is only sent to the auth endpoints. */
export const REFRESH_COOKIE_PATH = '/api/auth';

@Injectable()
export class AuthCookies {
  private readonly base: CookieOptions;

  constructor(config: ConfigService) {
    this.base = {
      httpOnly: true,
      secure: config.get<boolean>('COOKIE_SECURE') ?? false,
      sameSite: config.get<'lax' | 'strict' | 'none'>('COOKIE_SAMESITE') ?? 'lax',
      domain: config.get<string>('COOKIE_DOMAIN') || undefined,
    };
  }

  set(response: Response, tokens: IssuedTokens) {
    response.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...this.base,
      path: '/',
      maxAge: tokens.accessTokenMaxAgeMs,
    });
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...this.base,
      path: REFRESH_COOKIE_PATH,
      maxAge: tokens.refreshTokenMaxAgeMs,
    });
  }

  clear(response: Response) {
    response.clearCookie(ACCESS_COOKIE, { ...this.base, path: '/' });
    response.clearCookie(REFRESH_COOKIE, { ...this.base, path: REFRESH_COOKIE_PATH });
  }
}
