/**
 * Photos of the signature products from the company's design. They stand in
 * for a product until the admin uploads its own photo (that one always wins).
 */
const PHOTO_KEYS = ['sary-mai', 'zhupka', 'besh-barmak', 'kymyz', 'navat', 'kurut'] as const;

export function signaturePhotoKey(slug?: string | null) {
  if (!slug) return null;
  return PHOTO_KEYS.find((key) => slug === key || slug.startsWith(`${key}-`)) ?? null;
}

export function fallbackPhoto(slug?: string | null) {
  const key = signaturePhotoKey(slug);
  return key ? `/images/home/product-${key}.webp` : null;
}
