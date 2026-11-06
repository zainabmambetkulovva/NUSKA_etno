'use client';

import { motion, useReducedMotion } from 'framer-motion';

/** Line icons of the benefits, drawn when they scroll into view (TZ: microanimation). */
const PATHS: string[][] = [
  // Natural: leaf
  ['M6 26 C6 12 16 6 28 6 C28 18 22 28 8 28', 'M6 28 L20 14'],
  // Traditions: kochkor muyuz
  ['M17 26 C10 26 6 21 6 15 C6 9 11 6 15 9', 'M17 26 C24 26 28 21 28 15 C28 9 23 6 19 9'],
  // Convenient order: bag with a check
  ['M7 12 H27 L25 29 H9 Z', 'M12 12 C12 6 22 6 22 12', 'M12.5 20 L16 23.5 L22 17.5'],
  // Pickup: pin
  [
    'M17 30 C17 30 7 20 7 13.5 C7 8 11.5 4 17 4 C22.5 4 27 8 27 13.5 C27 20 17 30 17 30 Z',
    'M17 10 a3.5 3.5 0 1 0 0.01 0',
  ],
];

export function BenefitIcon({ index }: { index: number }) {
  const reduce = useReducedMotion();
  const paths = PATHS[index % PATHS.length];
  return (
    <motion.svg
      viewBox="0 0 34 34"
      className="h-8 w-8"
      fill="none"
      aria-hidden
      whileHover={reduce ? undefined : { scale: 1.12, rotate: -4 }}
    >
      {paths.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={reduce ? undefined : { pathLength: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 1, delay: 0.2 + i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </motion.svg>
  );
}
