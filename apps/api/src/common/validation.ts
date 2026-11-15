import { AppError } from './errors';
import { LOCALES } from './utils/locale';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Rejects duplicate locales in a translations array. */
export function assertUniqueLocales(translations: { locale: string }[]) {
  const seen = new Set<string>();
  for (const t of translations) {
    if (seen.has(t.locale)) {
      throw AppError.badRequest('DUPLICATE_LOCALE', `Translation for "${t.locale}" is given twice`);
    }
    seen.add(t.locale);
  }
}

/** Published content must exist in every supported language (TZ §15). */
export function assertAllLocales(locales: Iterable<string>, entity: string) {
  const present = new Set(locales);
  const missing = LOCALES.filter((locale) => !present.has(locale));
  if (missing.length > 0) {
    throw AppError.badRequest(
      'MISSING_TRANSLATIONS',
      `${entity} must have translations for: ${missing.join(', ')}`,
      { missingLocales: missing }
    );
  }
}
