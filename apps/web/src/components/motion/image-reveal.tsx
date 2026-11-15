'use client';

import type { ReactNode } from 'react';

import { motion } from 'framer-motion';

import { cn } from '@/lib/cn';

/** A picture uncovered by a curtain moving to the side, with a slight settle in scale. */
export function ImageReveal({
  children,
  className,
  from = 'left',
}: {
  children: ReactNode;
  className?: string;
  from?: 'left' | 'right' | 'bottom';
}) {
  const hidden =
    from === 'left'
      ? 'inset(0 100% 0 0)'
      : from === 'right'
        ? 'inset(0 0 0 100%)'
        : 'inset(100% 0 0 0)';
  return (
    <motion.div
      className={cn('overflow-hidden', className)}
      initial={{ clipPath: hidden }}
      whileInView={{ clipPath: 'inset(0 0% 0 0%)' }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
    >
      {/* the scale lives inside the clipped box, so it never widens the page */}
      <motion.div
        className="relative h-full w-full"
        initial={{ scale: 1.06 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
