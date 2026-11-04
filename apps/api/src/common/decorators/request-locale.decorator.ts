import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { DEFAULT_LOCALE, isLocale, Locale } from '../utils/locale';

/**
 * Resolves the content language of a request:
 * `?locale=` → `X-Locale` header → `Accept-Language` → 'ru'.
 */
export const RequestLocale = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Locale => {
    const request = context.switchToHttp().getRequest<Request>();
    const fromQuery = request.query.locale;
    if (isLocale(fromQuery)) return fromQuery;

    const fromHeader = request.header('x-locale');
    if (isLocale(fromHeader)) return fromHeader;

    const acceptLanguage = request.header('accept-language') ?? '';
    for (const part of acceptLanguage.split(',')) {
      const tag = part.split(';')[0].trim().toLowerCase().slice(0, 2);
      if (tag === 'ky' || tag === 'kg') return 'ky';
      if (tag === 'ru') return 'ru';
    }
    return DEFAULT_LOCALE;
  }
);
