'use client';

import type { PointerEvent } from 'react';

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

import { HORN_PATHS } from '@/components/brand/ornament';

const DISHES = [
  { label: 'Нават', x: '28%', y: '28%', color: '#F4E9B9', size: 92 },
  { label: 'Кымыз', x: '68%', y: '24%', color: '#FBF6E3', size: 104 },
  { label: 'Бал', x: '76%', y: '58%', color: '#E8B64C', size: 86 },
  { label: 'Сары май', x: '50%', y: '78%', color: '#F2D27A', size: 96 },
  { label: 'Жупка', x: '24%', y: '64%', color: '#E9D3A6', size: 88 },
  { label: 'Каттама', x: '50%', y: '47%', color: '#D9B77E', size: 118 },
];

/**
 * Lightweight 2D dastorkon composition. It is the WebGL fallback for the
 * planned 3D scene (TZ §7.7) and reacts softly to the cursor (TZ §7.2).
 */
export function HeroVisual() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-1, 1], [8, -8]), { stiffness: 60, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-1, 1], [-10, 10]), { stiffness: 60, damping: 18 });

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    mx.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    my.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[520px] [container-type:inline-size]"
      onPointerMove={onMove}
      onPointerLeave={() => (mx.set(0), my.set(0))}
      aria-hidden
    >
      <motion.div
        className="absolute inset-0"
        style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 1000 }}
      >
        {/* Dastorkon cloth */}
        <div className="absolute inset-[6%] rounded-full bg-brand shadow-lift" />
        <div className="absolute inset-[9%] rounded-full border-2 border-dashed border-cream/40" />
        <div className="bg-ornament absolute inset-[12%] rounded-full bg-cream-light" />
        {/* Ornament ring */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 text-cream/70" fill="none">
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={i} transform={`rotate(${i * 30} 100 100) translate(92 9) scale(0.14)`}>
              {HORN_PATHS.map((d) => (
                <path key={d} d={d} stroke="currentColor" strokeWidth={6} strokeLinecap="round" />
              ))}
            </g>
          ))}
        </svg>
        {/* Dishes */}
        {DISHES.map((dish, i) => (
          <div
            key={dish.label}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: dish.x, top: dish.y }}
          >
            <motion.div
              className="flex items-center justify-center rounded-full border-[3px] border-white text-center shadow-card sm:border-4"
              style={{
                width: `${(dish.size / 520) * 100}cqw`,
                aspectRatio: '1',
                background: dish.color,
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={reduce ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: [0, -6, 0] }}
              transition={{
                opacity: { delay: 0.2 + i * 0.12, duration: 0.5 },
                scale: { delay: 0.2 + i * 0.12, duration: 0.5 },
                y: {
                  delay: 1 + i * 0.3,
                  duration: 4 + i * 0.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            >
              <span className="font-serif text-[11px] font-semibold text-brand-dark sm:text-sm">
                {dish.label}
              </span>
            </motion.div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
