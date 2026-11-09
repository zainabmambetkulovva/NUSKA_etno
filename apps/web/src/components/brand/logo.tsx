import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/cn';

/**
 * The NUSKA_etno logo: the company's gold medallion (used as is, from the
 * design the company provided) and the name set in the serif font.
 * `tone`: "light" on dark green, "dark" on cream, "gold" for the footer.
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
          'relative shrink-0 transition-transform duration-500 group-hover:scale-105',
          size === 'lg' ? 'h-20 w-20' : 'h-11 w-11',
          tone === 'dark' && 'rounded-full bg-forest p-1'
        )}
      >
        <Image
          src="/images/logo.webp"
          alt=""
          fill
          sizes={size === 'lg' ? '80px' : '44px'}
          className="object-contain"
          priority={size === 'md'}
        />
      </span>
      <span
        className={cn(
          'font-serif font-medium tracking-wide',
          size === 'lg' ? 'text-3xl' : 'text-xl',
          tone === 'light' && 'text-cream-light',
          tone === 'dark' && 'text-forest',
          tone === 'gold' && 'text-honey-light'
        )}
      >
        NUSKA_etno
      </span>
    </Link>
  );
}
