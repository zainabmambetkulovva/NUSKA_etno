import 'server-only';

import type { Locale } from './config';
import type { Dictionary } from './dictionaries/ky';

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  ky: () => import('./dictionaries/ky').then((m) => m.default),
  ru: () => import('./dictionaries/ru').then((m) => m.default),
};

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]();
}

export type { Dictionary };
