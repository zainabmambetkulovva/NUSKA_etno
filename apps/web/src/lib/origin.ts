import type { RegionId } from '@/components/home/kg-regions';

/**
 * Where each product is traditionally made in Kyrgyzstan, as given by the
 * company (November 2026). It is the region of the tradition, not the address
 * of production. Keys match catalog slugs ("navat" covers "navat-0-5", …).
 */
export type OriginKey =
  | 'zhupka'
  | 'kymyz'
  | 'besh-barmak'
  | 'sary-mai'
  | 'keremet-shypaa'
  | 'kholodets'
  | 'kattama'
  | 'navat'
  | 'bal';

export const ORIGIN: { key: OriginKey; regions: RegionId[] | 'all' | 'none' }[] = [
  { key: 'zhupka', regions: ['talas', 'osh', 'jalal-abad', 'batken'] },
  { key: 'kymyz', regions: ['naryn', 'issyk-kul', 'talas'] },
  { key: 'besh-barmak', regions: ['chui', 'talas', 'naryn'] },
  { key: 'sary-mai', regions: 'all' },
  { key: 'keremet-shypaa', regions: 'all' },
  { key: 'kholodets', regions: 'all' },
  { key: 'kattama', regions: 'all' },
  { key: 'navat', regions: 'none' },
  { key: 'bal', regions: 'none' },
];

export function productsOfRegion(region: RegionId) {
  return ORIGIN.filter((o) => Array.isArray(o.regions) && o.regions.includes(region)).map(
    (o) => o.key
  );
}

export const EVERYWHERE = ORIGIN.filter((o) => o.regions === 'all').map((o) => o.key);
export const NO_REGION = ORIGIN.filter((o) => o.regions === 'none').map((o) => o.key);

/** Regions that have products of their own (pins on the map). */
export const PINNED = new Set(
  ORIGIN.flatMap((o) => (Array.isArray(o.regions) ? o.regions : [])) as RegionId[]
);
