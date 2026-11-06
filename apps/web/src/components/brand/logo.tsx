import Link from 'next/link';

import { KochkorMuyuz } from './ornament';

import { cn } from '@/lib/cn';

/** Text logo until the company provides the original logo file. */
/** `animate`: the ornament draws itself once when the page loads (TZ §7.6 logo animation). */
export function Logo({
  href,
  className,
  animate,
}: {
  href: string;
  className?: string;
  animate?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn('group inline-flex items-center gap-2 text-brand', className)}
      aria-label="NUSKA_etno"
    >
      <KochkorMuyuz
        className="h-6 w-12 transition-transform duration-500 group-hover:scale-110"
        animate={animate}
      />
      <span className="font-serif text-xl font-semibold tracking-wide">
        NUSKA<span className="text-olive">_etno</span>
      </span>
    </Link>
  );
}
