'use client';

import { useRef, type ReactNode } from 'react';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

import { cn } from '@/lib/cn';

/**
 * Parallax (TZ §7.6): the layer moves slower than the page while its section
 * scrolls through the viewport. `speed` is the share of the scroll distance,
 * e.g. 0.25 moves the layer by a quarter. Transform-only, no layout work.
 */
export function Parallax({
  children,
  speed = 0.25,
  className,
}: {
  children?: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`${-speed * 50}%`, `${speed * 50}%`]);
  return (
    <div
      ref={ref}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      <motion.div className="absolute inset-[-20%_0]" style={reduce ? undefined : { y }}>
        {children}
      </motion.div>
    </div>
  );
}
