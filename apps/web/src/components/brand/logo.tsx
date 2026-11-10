import { useId } from 'react';

import Link from 'next/link';

import { cn } from '@/lib/cn';

/**
 * NUSKA_etno mark: a gold knot of four lobes around a diamond (as on the
 * brand reference), drawn as a vector so it stays sharp at any size.
 */
export function LogoMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 100 100" className={cn('h-10 w-10', className)} aria-hidden>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6DFA6" />
          <stop offset="0.55" stopColor="#D6AD62" />
          <stop offset="1" stopColor="#A9772F" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#g${id})`} strokeWidth="4.2" strokeLinejoin="round">
        {[
          [50, 23],
          [77, 50],
          [50, 77],
          [23, 50],
        ].map(([x, y]) => (
          <rect
            key={`${x}-${y}`}
            x={x - 12}
            y={y - 12}
            width="24"
            height="24"
            rx="5"
            transform={`rotate(45 ${x} ${y})`}
          />
        ))}
        <path d="M50 35 L65 50 L50 65 L35 50 Z" />
      </g>
      <g fill={`url(#g${id})`}>
        <circle cx="50" cy="23" r="3.6" />
        <circle cx="77" cy="50" r="3.6" />
        <circle cx="50" cy="77" r="3.6" />
        <circle cx="23" cy="50" r="3.6" />
        <circle cx="50" cy="50" r="3" />
      </g>
    </svg>
  );
}

/** The logo: gold mark and the name in the serif font. */
export function Logo({
  href,
  className,
  tone = 'light',
  size = 'md',
}: {
  href: string;
  className?: string;
  tone?: 'light' | 'dark' | 'gold';
  size?: 'md' | 'lg';
}) {
  return (
    <Link
      href={href}
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="NUSKA_etno"
    >
      <LogoMark
        className={cn(
          'shrink-0 transition-transform duration-500 group-hover:rotate-45',
          size === 'lg' ? 'h-14 w-14' : 'h-10 w-10',
          tone === 'dark' && 'rounded-full bg-forest p-1'
        )}
      />
      <span
        className={cn(
          'font-serif font-medium tracking-wide',
          size === 'lg' ? 'text-3xl' : 'text-xl',
          tone === 'light' && 'text-cream-light',
          tone === 'dark' && 'text-forest',
          tone === 'gold' && 'text-[#E7C77F]'
        )}
      >
        NUSKA_etno
      </span>
    </Link>
  );
}
