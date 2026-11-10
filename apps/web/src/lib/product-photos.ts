/**
 * Product photos sent by the company (public/images/products). They are
 * shown for a product until the admin uploads its own photo, which always
 * wins. Matched by slug: "navat" also covers "navat-0-5", "navat-0-6", …
 */
const PHOTOS: Record<string, string> = {
  navat: '/images/products/navat.webp',
  'besh-barmak': '/images/products/besh-barmak.webp',
  kymyz: '/images/products/kymyz.webp',
  zhupka: '/images/products/zhupka.webp',
  'sary-mai': '/images/products/sary-mai.webp',
};

export function companyPhoto(slug?: string | null) {
  if (!slug) return null;
  const key = Object.keys(PHOTOS).find((k) => slug === k || slug.startsWith(`${k}-`));
  return key ? PHOTOS[key] : null;
}
