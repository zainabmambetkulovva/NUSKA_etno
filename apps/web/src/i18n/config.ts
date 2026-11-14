export const locales = ['ky', 'ru'] as const;
export type Locale = (typeof locales)[number];

/** Kyrgyz is the primary language of the site. */
export const defaultLocale: Locale = 'ky';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export const localeNames: Record<Locale, string> = { ky: 'Кыргызча', ru: 'Русский' };
export const localeShort: Record<Locale, string> = { ky: 'KG', ru: 'RU' };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
