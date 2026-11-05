import Link from 'next/link';

import { KochkorMuyuz } from './ornament';

import { cn } from '@/lib/cn';

/** Text logo until the company provides the original logo file. */
export function Logo({ href, className }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn('group inline-flex items-center gap-2 text-brand', className)}
      aria-label="NUSKA_etno"
    >
      <KochkorMuyuz className="h-6 w-12 transition-transform duration-500 group-hover:scale-110" />
      <span className="font-serif text-xl font-semibold tracking-wide">
        NUSKA<span className="text-olive">_etno</span>
      </span>
    </Link>
  );
}
