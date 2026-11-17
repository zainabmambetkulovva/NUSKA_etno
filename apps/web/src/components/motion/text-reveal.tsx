'use client';

import { createElement, useRef, type ElementType } from 'react';

import { motion, useInView } from 'framer-motion';

import { cn } from '@/lib/cn';

/**
 * Heading whose words rise one after another from behind a mask when it comes
 * into view (or on mount with `immediate`). Screen readers get the plain text.
 * Visibility is watched on the heading itself: the words start hidden behind
 * their mask, so the browser would never report them as visible.
 * With reduced motion (MotionConfig "user") only the fade remains.
 */
export function TextReveal({
  text,
  as = 'h2',
  className,
  id,
  immediate = false,
  delay = 0,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  id?: string;
  immediate?: boolean;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const words = text.split(/\s+/);
  const show = { y: '0%', opacity: 1 };
  const hidden = { y: '105%', opacity: 0 };
  return createElement(
    as,
    { ref, className: cn(className), id, 'aria-label': text },
    words.map((word, i) => (
      <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-top">
        <motion.span
          className="inline-block"
          initial={hidden}
          animate={immediate || inView ? show : hidden}
          transition={{ duration: 0.75, delay: delay + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
          {i < words.length - 1 ? ' ' : ''}
        </motion.span>
      </span>
    ))
  );
}
