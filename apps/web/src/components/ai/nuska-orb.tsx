'use client';

import { HORN_PATHS } from '@/components/brand/ornament';
import { cn } from '@/lib/cn';

/**
 * Brand symbol of NUSKA AI: a deep-green sphere with a soft glow, a slowly
 * turning ring of kochkor muyuz and a cream core. Pure SVG + CSS (no WebGL),
 * so it is cheap enough for the floating button; motion stops with
 * prefers-reduced-motion.
 */
export function NuskaOrb({ className, active = false }: { className?: string; active?: boolean }) {
  return (
    <span className={cn('relative inline-block', className)} aria-hidden>
      <span
        className={cn(
          'absolute inset-0 rounded-full bg-gold/40 blur-md motion-safe:animate-pulse',
          active && 'bg-gold/70'
        )}
      />
      <svg viewBox="0 0 100 100" className="relative h-full w-full">
        <defs>
          <radialGradient id="nuska-orb" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#5E8F68" />
            <stop offset="55%" stopColor="#355B3E" />
            <stop offset="100%" stopColor="#1F3A27" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#nuska-orb)" />
        <g
          className={cn(
            'origin-center motion-safe:animate-spin-slow',
            active && 'motion-safe:[animation-duration:6s]'
          )}
          style={{ transformBox: 'fill-box' }}
        >
          {[0, 90, 180, 270].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 50 50) translate(35 14) scale(0.25)`}>
              {HORN_PATHS.map((d) => (
                <path
                  key={d}
                  d={d}
                  fill="none"
                  stroke="#E2CFA4"
                  strokeWidth={5}
                  strokeLinecap="round"
                />
              ))}
            </g>
          ))}
        </g>
        <circle cx="50" cy="50" r="15" fill="#F4E9B9" />
        <circle cx="45" cy="45" r="5" fill="#FFFDF5" opacity="0.8" />
      </svg>
    </span>
  );
}
