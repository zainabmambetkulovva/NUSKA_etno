'use client';

import { useEffect } from 'react';

import { useMotionValue, useReducedMotion } from 'framer-motion';

/**
 * 1 normally, 0 for visitors who prefer reduced motion. Multiplying movement
 * by it keeps the server and client markup identical (no hydration mismatch)
 * while the movement itself is switched off.
 */
export function useMotionEnabled() {
  const reduce = useReducedMotion();
  const enabled = useMotionValue(1);
  useEffect(() => enabled.set(reduce ? 0 : 1), [reduce, enabled]);
  return enabled;
}
