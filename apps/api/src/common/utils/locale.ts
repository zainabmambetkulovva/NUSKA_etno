/** Kyrgyz is the primary language of the site; Russian is the second one. */
export const LOCALES = ['ky', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ky';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Picks the translation for `locale`, falling back to the default locale as a whole (never per field). */
export function pickTranslation<T extends { locale: string }>(
  translations: T[],
  locale: Locale
): T | undefined {
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === DEFAULT_LOCALE) ??
    translations[0]
  );
}
