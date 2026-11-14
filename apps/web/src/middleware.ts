import { NextResponse, type NextRequest } from 'next/server';

import { defaultLocale, isLocale, LOCALE_COOKIE } from './i18n/config';

/**
 * Every page lives under /ky or /ru. Requests without a locale prefix are
 * redirected to the saved language (cookie) or Kyrgyz by default.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split('/')[1];

  if (isLocale(first)) {
    const response = NextResponse.next();
    if (request.cookies.get(LOCALE_COOKIE)?.value !== first) {
      response.cookies.set(LOCALE_COOKIE, first, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
    }
    return response;
  }

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : defaultLocale;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip the API proxy, Next internals and files with an extension.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
