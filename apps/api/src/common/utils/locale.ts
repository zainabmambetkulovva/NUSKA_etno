export const LOCALES = ['ru', 'ky'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ru';

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
