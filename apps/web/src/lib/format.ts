import type { Money } from '@nuska/types';

import type { Locale } from '@/i18n/config';

// Numbers: Kyrgyz uses the same grouping as Russian (space, decimal comma).
const intlLocale: Record<Locale, string> = { ky: 'ru-RU', ru: 'ru-RU' };

/** Prices are stored in tyiyn; shown in som ("235 сом", "97,50 сом"). */
export function formatMoney(money: Money | number, locale: Locale, somLabel = 'сом') {
  const amount = typeof money === 'number' ? money : money.amount;
  const som = amount / 100;
  const formatted = new Intl.NumberFormat(intlLocale[locale], {
    minimumFractionDigits: Number.isInteger(som) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(som);
  return `${formatted} ${somLabel}`;
}

// Browsers' Intl data has no Kyrgyz month names (it silently falls back to English),
// so Kyrgyz dates are formatted by hand: "2026-ж. 4-ноябрь, 12:51".
const KY_MONTHS = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
];

/** Shop time zone: the same time is shown on the server and in every browser. */
export const SHOP_TIME_ZONE = 'Asia/Bishkek';

export function formatDate(value: string | Date, locale: Locale, withTime = false) {
  const date = new Date(value);
  if (locale === 'ky') {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: SHOP_TIME_ZONE,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(date)
        .map((p) => [p.type, p.value])
    );
    const text = `${parts.year}-ж. ${Number(parts.day)}-${KY_MONTHS[Number(parts.month) - 1]}`;
    return withTime ? `${text}, ${parts.hour}:${parts.minute}` : text;
  }
  return new Intl.DateTimeFormat(intlLocale[locale], {
    timeZone: SHOP_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

export function formatOrderNumber(orderNumber: number) {
  return `№${String(orderNumber).padStart(5, '0')}`;
}

export function somToTyiyn(som: number) {
  return Math.round(som * 100);
}
