import { HORN_PATHS } from '@/components/brand/horn-paths';
import { cn } from '@/lib/cn';

/**
 * Medallion on the top edge of the header: a cream cartouche with two
 * mirrored kochkor muyuz and a central diamond (as on the design reference).
 */
export function HeaderMedallion({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 64" className={cn('h-12 w-36', className)} aria-hidden>
      <path
        d="M4 52 C40 52 52 30 70 22 C84 15 92 4 100 2 C108 4 116 15 130 22 C148 30 160 52 196 52 Z"
        fill="#FBF6E3"
        stroke="#C7A76C"
        strokeWidth="1.5"
      />
      <g
        transform="translate(46 20) scale(0.45)"
        stroke="#355B3E"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      >
        {HORN_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g
        transform="translate(154 20) scale(-0.45 0.45)"
        stroke="#355B3E"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      >
        {HORN_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path d="M100 14 L108 26 L100 38 L92 26 Z" fill="#355B3E" />
      <circle cx="100" cy="26" r="3" fill="#E2CFA4" />
    </svg>
  );
}
