'use client';

import { useRef, type ReactNode } from 'react';

import { motion, useInView } from 'framer-motion';

import { cn } from '@/lib/cn';

/**
 * A picture uncovered by a curtain moving to the side, with a slight settle in
 * scale. Visibility is watched on the outer box, which is never clipped (a
 * fully clipped element is never reported as visible by the browser).
 */
export function ImageReveal({
  children,
  className,
  from = 'left',
}: {
  children: ReactNode;
  className?: string;
  from?: 'left' | 'right' | 'bottom';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const hidden =
    from === 'left'
      ? 'inset(0 100% 0 0)'
      : from === 'right'
        ? 'inset(0 0 0 100%)'
        : 'inset(100% 0 0 0)';
  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      <motion.div
        className="h-full w-full overflow-hidden"
        initial={{ clipPath: hidden }}
        animate={{ clipPath: inView ? 'inset(0 0% 0 0%)' : hidden }}
        transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
      >
        {/* the scale lives inside the clipped box, so it never widens the page */}
        <motion.div
          className="relative h-full w-full"
          initial={{ scale: 1.06 }}
          animate={{ scale: inView ? 1 : 1.06 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
