import type { CSSProperties } from 'react';

import { Leaf } from './kyrgyz-decor';

import { cn } from '@/lib/cn';

/** Soft white cloud that slowly drifts (CSS only, no images). */
export function Cloud({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute animate-drift motion-reduce:animate-none',
        className
      )}
      style={style}
      aria-hidden
    >
      <div className="relative h-full w-full">
        <span className="absolute inset-x-[10%] bottom-0 top-[35%] rounded-full bg-white/80 blur-xl" />
        <span className="absolute bottom-[10%] left-[22%] h-[75%] w-[38%] rounded-full bg-white/85 blur-lg" />
        <span className="absolute bottom-[12%] right-[18%] h-[60%] w-[34%] rounded-full bg-white/80 blur-lg" />
      </div>
    </div>
  );
}

/** A golden eagle gliding over the mountains, wings beating now and then. */
export function Eagle({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute animate-glide motion-reduce:animate-none',
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 120 48"
        className="h-full w-full drop-shadow-[0_6px_6px_rgba(60,40,20,0.25)]"
      >
        <g className="origin-[60px_24px] animate-flap motion-reduce:animate-none" fill="#4A3424">
          <path d="M58 24C46 12 30 6 4 8c14 4 24 9 30 16 8 1 16 1 24 0Z" />
          <path d="M62 24c12-12 28-18 54-16-14 4-24 9-30 16-8 1-16 1-24 0Z" />
        </g>
        <path d="M50 24c4-3 16-3 20 0 0 4-4 8-10 8s-10-4-10-8Z" fill="#3B2A1C" />
        <path d="M70 23c3-1 6 0 8 2l-4 1-4-1Z" fill="#E2B04A" />
        <circle cx="72.5" cy="23.6" r="1.4" fill="#F4E3BE" />
        <path d="M54 30l-6 8 8-4 4 6 4-6 8 4-6-8Z" fill="#5A4030" />
      </svg>
    </div>
  );
}

/** A branch of leaves at the edge of a section (the mockup's framing leaves). */
export function Branch({
  className,
  flip,
  style,
}: {
  className?: string;
  flip?: boolean;
  style?: CSSProperties;
}) {
  const leaves = [
    { x: 6, y: 4, r: -38, d: 0 },
    { x: 34, y: 18, r: -12, d: -2 },
    { x: 8, y: 34, r: -58, d: -4 },
    { x: 38, y: 48, r: -20, d: -1 },
    { x: 12, y: 64, r: -48, d: -5 },
  ];
  return (
    <div
      className={cn('pointer-events-none absolute h-48 w-28', flip && '-scale-x-100', className)}
      style={style}
      aria-hidden
    >
      <svg viewBox="0 0 112 192" className="absolute inset-0 h-full w-full" fill="none">
        <path
          d="M10 0c18 40 30 90 34 192"
          stroke="#6D7F4C"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity=".75"
        />
      </svg>
      {leaves.map((leaf, i) => (
        <Leaf
          key={i}
          className="absolute h-9 w-14"
          style={
            {
              left: `${leaf.x}%`,
              top: `${leaf.y}%`,
              animationDelay: `${leaf.d}s`,
              '--sway-from': `${leaf.r - 6}deg`,
              '--sway-to': `${leaf.r + 6}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
