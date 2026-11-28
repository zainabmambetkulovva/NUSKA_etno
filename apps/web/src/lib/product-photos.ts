/**
 * Product photos sent by the company: the real packages on a transparent
 * background, converted to WebP without visible loss (public/images/products). A product
 * shows its photo until the admin uploads another one, which always wins.
 * Matched by slug: "navat" also covers "navat-0-5", "navat-0-6", …
 */
const PHOTOS: Record<string, string> = {
  navat: '/images/products/navat.webp',
  'besh-barmak': '/images/products/besh-barmak.webp',
  kymyz: '/images/products/kymyz.webp',
  zhupka: '/images/products/zhupka.webp',
  'sary-mai': '/images/products/sary-mai.webp',
  'keremet-shypaa': '/images/products/keremet-shypaa.webp',
  kattama: '/images/products/kattama.webp',
  kholodets: '/images/products/kholodets.webp',
  bal: '/images/products/bal.webp',
  kompot: '/images/products/kompot.webp',
};

export function companyPhoto(slug?: string | null) {
  if (!slug) return null;
  const key = Object.keys(PHOTOS).find((k) => slug === k || slug.startsWith(`${k}-`));
  return key ? PHOTOS[key] : null;
}
