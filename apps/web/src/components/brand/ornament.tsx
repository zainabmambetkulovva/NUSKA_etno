'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { HORN_PATHS } from './horn-paths';

import { cn } from '@/lib/cn';

/**
 * Modern line interpretation of "кочкор мүйүз" (ram's horns), the most common
 * Kyrgyz ornament motif. Symmetric, thin strokes, used sparingly (TZ §2.4).
 */
export { HORN_PATHS };

export function KochkorMuyuz({
  className,
  animate = false,
}: {
  className?: string;
  animate?: boolean;
}) {
  const reduce = useReducedMotion();
  const draw = animate && !reduce;
  return (
    <svg viewBox="0 0 120 60" fill="none" aria-hidden className={cn('h-8 w-16', className)}>
      {HORN_PATHS.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          initial={draw ? { pathLength: 0, opacity: 0 } : false}
          whileInView={draw ? { pathLength: 1, opacity: 1 } : undefined}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.2, delay: i * 0.12, ease: 'easeInOut' }}
        />
      ))}
    </svg>
  );
}

/** Section divider: line — ornament — line, drawn when it scrolls into view. */
export function OrnamentDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex items-center justify-center gap-4 text-brand/70', className)}
      aria-hidden
    >
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-brand/40 md:w-28" />
      <KochkorMuyuz animate />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-brand/40 md:w-28" />
    </div>
  );
}

/** Loading indicator with the ornament (TZ §7.6 "Loading screen"). */
export function OrnamentLoader({ label, className }: { label: string; className?: string }) {
  return (
    <div role="status" className={cn('flex flex-col items-center gap-3 text-brand', className)}>
      <svg viewBox="0 0 120 60" fill="none" aria-hidden className="h-12 w-24">
        {HORN_PATHS.map((d) => (
          <path
            key={d}
            d={d}
            pathLength={1}
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeDasharray="1"
            className="motion-safe:animate-draw"
          />
        ))}
      </svg>
      <span className="text-sm text-ink-muted">{label}</span>
    </div>
  );
}
