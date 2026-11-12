import { useId } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/cn';

/**
 * Gold knot ornament of the design (four lobes around a diamond), drawn as a
 * vector; used as a decoration next to titles and in the corners.
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

/**
 * The NUSKA logo sent by the company (public/images/logo-nuska.png, the
 * label's own cream background only trimmed at the edges), on a cream badge
 * of the same colour, with the name NUSKA_etno next to it.
 */
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
      <span
        className={cn(
          'relative shrink-0 overflow-hidden rounded-xl bg-[#F5DAAD] shadow-[0_4px_14px_-6px_rgba(0,0,0,0.5)] ring-1 ring-[#D6AD62]/50 transition-transform duration-500 group-hover:scale-105',
          size === 'lg' ? 'h-[72px] w-[79px] rounded-2xl' : 'h-12 w-[53px]'
        )}
      >
        <Image
          src="/images/logo-nuska.png"
          alt=""
          fill
          quality={95}
          sizes={size === 'lg' ? '160px' : '106px'}
          className="object-cover"
          priority={size === 'md'}
        />
      </span>
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
