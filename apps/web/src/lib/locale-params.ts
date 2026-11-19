import { notFound } from 'next/navigation';

import { isLocale, type Locale } from '@/i18n/config';

/** Validates the [locale] route segment (Next 15 passes params as a promise). */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

/**
 * Public site address for canonical links, the sitemap and link previews:
 * NEXT_PUBLIC_SITE_URL, else the production address Vercel provides.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')
).replace(/\/$/, '');

/** hreflang alternates for a path without the locale prefix, e.g. "/catalog". */
export function alternates(locale: Locale, path = '') {
  return {
    canonical: `${siteUrl}/${locale}${path}`,
    languages: {
      ky: `${siteUrl}/ky${path}`,
      ru: `${siteUrl}/ru${path}`,
      'x-default': `${siteUrl}/ky${path}`,
    },
  };
}
