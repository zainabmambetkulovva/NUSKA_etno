/**
 * Product photos sent by the company: the real packages on a transparent
 * background, stored exactly as sent (public/images/products). A product
 * shows its photo until the admin uploads another one, which always wins.
 * Matched by slug: "navat" also covers "navat-0-5", "navat-0-6", …
 */
const PHOTOS: Record<string, string> = {
  navat: '/images/products/navat.png',
  'besh-barmak': '/images/products/besh-barmak.png',
  kymyz: '/images/products/kymyz.png',
  zhupka: '/images/products/zhupka.png',
  'sary-mai': '/images/products/sary-mai.png',
  'keremet-shypaa': '/images/products/keremet-shypaa.png',
};

export function companyPhoto(slug?: string | null) {
  if (!slug) return null;
  const key = Object.keys(PHOTOS).find((k) => slug === k || slug.startsWith(`${k}-`));
  return key ? PHOTOS[key] : null;
}
