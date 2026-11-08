import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Infinite horizontal ticker: the items are rendered twice and the track moves
 * by half its width, so the loop is seamless. Pauses on hover; with
 * prefers-reduced-motion it becomes a static, wrapping row.
 */
export function Marquee({
  items,
  className,
  duration = 40,
  reverse = false,
  label,
}: {
  items: ReactNode[];
  className?: string;
  duration?: number;
  reverse?: boolean;
  label?: string;
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]',
        className
      )}
      role={label ? 'region' : undefined}
      aria-label={label}
    >
      <div
        className={cn(
          'flex w-max motion-safe:animate-marquee group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center',
          reverse && '[animation-direction:reverse]'
        )}
        style={{ ['--marquee-duration' as string]: `${duration}s` }}
      >
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className={cn('flex shrink-0 items-center', copy === 1 && 'motion-reduce:hidden')}
            aria-hidden={copy === 1 || undefined}
          >
            {items.map((item, i) => (
              <li key={i} className="flex shrink-0 items-center">
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
