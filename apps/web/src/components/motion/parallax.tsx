'use client';

import { useRef, type ReactNode } from 'react';

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

import { useMotionEnabled } from './use-motion-enabled';

/** Moves its content against the scroll (depth): `speed` px up and down across the viewport. */
export function Parallax({
  children,
  className,
  speed = 40,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useMotionEnabled();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const raw = useTransform(
    [scrollYProgress, enabled],
    ([p, on]) => (speed - (p as number) * speed * 2) * (on as number)
  );
  const y = useSpring(raw, { stiffness: 120, damping: 30 });
  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}
