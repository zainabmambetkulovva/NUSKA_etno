import { cn } from '@/lib/cn';

/** Line icons of the catalog sections (mega menu). Unknown categories get a bag. */
const ICONS: Record<string, string[]> = {
  bag: ['M6 8h12l-1 12H7L6 8Z', 'M9 8a3 3 0 0 1 6 0', 'M9.5 14l2 2 3.5-3.5'],
  bowl: ['M3 11h18a9 9 0 0 1-18 0Z', 'M9 7c0-1.5 1-2 1-3', 'M14 7c0-1.5 1-2 1-3', 'M8 20h8'],
  jar: ['M7 8h10v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8Z', 'M8 5h8v3H8z', 'M10 12c1 1 3 1 4 0'],
  sweets: ['M12 4l5 5-5 11-5-11 5-5Z', 'M7 9h10'],
  meat: ['M5 15c0-5 4-9 9-9 3 0 5 2 5 5 0 5-4 9-9 9-3 0-5-2-5-5Z', 'M10 13a2 2 0 1 0 0.01 0'],
  gift: ['M4 10h16v10H4z', 'M3 7h18v3H3z', 'M12 7v13', 'M12 7c-2-3-5-3-5 0', 'M12 7c2-3 5-3 5 0'],
};

const BY_SLUG: Record<string, keyof typeof ICONS> = {
  'dairy-products': 'jar',
  'traditional-dishes': 'bowl',
  'natural-honey': 'jar',
  'national-sweets': 'sweets',
  'meat-products': 'meat',
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const paths = ICONS[BY_SLUG[slug] ?? (slug === 'gift' ? 'gift' : 'bag')];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-6 w-6', className)}
      aria-hidden
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
