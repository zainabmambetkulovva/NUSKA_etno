'use client';

import type { ReactNode } from 'react';

import { motion } from 'framer-motion';

/**
 * Page transition (TZ §7.6): every navigation fades the new page in with a
 * small upward movement. Header and footer stay in place (they live in the
 * layout). Disabled automatically for prefers-reduced-motion (MotionConfig).
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
