'use client';

import { motion } from 'framer-motion';

import { cn } from '@/lib/cn';

/**
 * Honey-coloured transition between sections: a golden wave draws itself when
 * it comes into view and a drop of honey runs down from its lowest point.
 */
export function HoneyDivider({ className }: { className?: string }) {
  const wave = 'M0 22 C120 6 240 6 360 20 S600 38 720 22 S960 4 1080 18 S1320 36 1440 20';
  return (
    <div
      className={cn('pointer-events-none relative h-16 w-full overflow-visible', className)}
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="honey-line" x1="0" x2="1">
            <stop offset="0" stopColor="#C7A66A" stopOpacity="0" />
            <stop offset="0.2" stopColor="#D9A85B" />
            <stop offset="0.5" stopColor="#E9B95E" />
            <stop offset="0.8" stopColor="#D9A85B" />
            <stop offset="1" stopColor="#C7A66A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={wave}
          fill="none"
          stroke="url(#honey-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 1.8, ease: 'easeInOut' }}
        />
      </svg>
      <motion.span
        className="absolute left-1/2 top-[38%] block h-3 w-2 -translate-x-1/2 rounded-b-full rounded-t-[40%] bg-gradient-to-b from-[#F0C46A] to-[#C98A2B] shadow-[0_2px_6px_rgba(201,138,43,0.5)]"
        initial={{ y: 0, scaleY: 0.3, opacity: 0 }}
        whileInView={{ y: [0, 4, 36], scaleY: [0.3, 1.3, 1], opacity: [0, 1, 0] }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 2.2, delay: 1.4, times: [0, 0.45, 1], ease: 'easeIn' }}
      />
    </div>
  );
}
