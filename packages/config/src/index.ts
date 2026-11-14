// Common, non-secret configuration for NUSKA_etno.
// Secrets (DATABASE_URL, JWT secrets) are read only by the API from its own
// environment and must never get a fallback value here.

export const SUPPORTED_LOCALES = ['ky', 'ru'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ky';

export const DEFAULT_CURRENCY = 'KGS';

export const config = {
  app: {
    name: 'NUSKA_etno',
    version: '0.1.0',
  },
  api: {
    defaultPort: 4000,
  },
  i18n: {
    locales: SUPPORTED_LOCALES,
    defaultLocale: DEFAULT_LOCALE,
  },
  currency: DEFAULT_CURRENCY,
} as const;
