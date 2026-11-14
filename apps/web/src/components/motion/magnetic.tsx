'use client';

import type { PointerEvent, ReactNode } from 'react';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

/** The child leans toward a mouse pointer near it and springs back when it leaves. */
export function Magnetic({
  children,
  className,
  strength = 0.28,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 });
  const move = (event: PointerEvent<HTMLSpanElement>) => {
    if (reduce || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * strength);
    y.set((event.clientY - rect.top - rect.height / 2) * strength);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };
  return (
    <motion.span
      className={className ?? 'inline-flex'}
      style={{ x, y }}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {children}
    </motion.span>
  );
}
