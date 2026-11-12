import type { CSSProperties, ReactNode } from 'react';

import { HORN_PATHS } from './horn-paths';

import { cn } from '@/lib/cn';

/** A pair of kochkor muyuz (ram's horns) placed at x/y, rotated and scaled. */
function Horns({ x, y, r = 0, s = 1 }: { x: number; y: number; r?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s}) translate(-60 -32)`}>
      {HORN_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
}

/**
 * Gold corner ornament in the spirit of Kyrgyz shyrdak and wood carving:
 * a double bracket with curled ends and ram's horns growing along the diagonal.
 * Drawn for the top-left corner; mirror it with `-scale-x-100` / `-scale-y-100`.
 */
export function OrnamentCorner({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 220 220"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-40 w-40', className)}
      style={style}
      aria-hidden
    >
      <g strokeWidth="2.4">
        <path d="M8 212 V56 C8 28 28 8 56 8 H212" />
        <path d="M22 212 V64 C22 40 40 22 64 22 H212" strokeOpacity=".55" />
        {/* curled ends */}
        <path d="M212 8 C226 8 230 26 218 32 C208 37 199 27 205 20" />
        <path d="M8 212 C8 226 26 230 32 218 C37 208 27 199 20 205" />
        <path d="M120 22 C120 38 136 46 146 38 C154 31 148 20 140 24" />
        <path d="M22 120 C38 120 46 136 38 146 C31 154 20 148 24 140" />
      </g>
      <g strokeWidth="3.4">
        <Horns x={62} y={62} r={-45} s={0.62} />
        <Horns x={104} y={104} r={-45} s={0.42} />
      </g>
      <g fill="currentColor" stroke="none">
        <path d="M40 40 L52 28 L64 40 L52 52 Z" />
        <circle cx="132" cy="132" r="4" />
        <circle cx="176" cy="40" r="3" />
        <circle cx="40" cy="176" r="3" />
      </g>
    </svg>
  );
}

/** Line — diamond — title — diamond — line, as around the section titles of the design. */
export function TitleFlourish({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-1.5', className)} aria-hidden>
      <span className="hidden h-px w-24 bg-gradient-to-r from-transparent to-current sm:block" />
      <svg viewBox="0 0 24 12" className="h-3 w-6" fill="currentColor">
        <path d="M0 6 H8 M16 6 H24" stroke="currentColor" strokeWidth="1.2" />
        <path d="M12 1 L17 6 L12 11 L7 6 Z" />
      </svg>
    </span>
  );
}

export function SectionTitle({
  children,
  id,
  className,
  tone = 'dark',
}: {
  children: ReactNode;
  id?: string;
  className?: string;
  tone?: 'dark' | 'light';
}) {
  return (
    <div className={cn('flex items-center justify-center gap-3 sm:gap-5', className)}>
      <TitleFlourish className="text-honey-dark" />
      <h2
        id={id}
        className={cn(
          'text-center font-serif text-3xl font-medium tracking-tight sm:text-4xl',
          tone === 'dark' ? 'text-forest' : 'text-cream-light'
        )}
      >
        {children}
      </h2>
      <TitleFlourish className="rotate-180 text-honey-dark" />
    </div>
  );
}

/**
 * Soft wave that joins two sections. `fill` is the colour of the section the
 * wave belongs to; put it at the very top (or bottom with `flip`) of that section.
 */
export function Wave({
  className,
  flip,
  variant = 1,
}: {
  className?: string;
  flip?: boolean;
  variant?: 1 | 2;
}) {
  const d =
    variant === 1
      ? 'M0 64 C220 10 470 0 720 26 C980 54 1200 58 1440 18 V80 H0 Z'
      : 'M0 30 C260 70 520 74 760 42 C1000 10 1220 6 1440 44 V80 H0 Z';
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className={cn(
        'pointer-events-none block h-10 w-full sm:h-16',
        flip && 'rotate-180',
        className
      )}
      fill="currentColor"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

/**
 * A green leaf that drifts and sways all the time (decoration at the edges of the
 * sections). It keeps moving under "reduce motion" too, only much slower.
 */
export function Leaf({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 80 48"
      className={cn(
        'pointer-events-none h-12 w-20 animate-leaf-drift motion-reduce:[animation-duration:18s]',
        className
      )}
      style={style}
      aria-hidden
    >
      <defs>
        <linearGradient id="nuska-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7DA453" />
          <stop offset="1" stopColor="#2F5E2A" />
        </linearGradient>
      </defs>
      <path d="M2 40 C14 10 46 0 78 4 C70 28 44 48 2 40 Z" fill="url(#nuska-leaf)" />
      <path
        d="M4 39 C26 30 48 18 74 6"
        stroke="#D5E4B5"
        strokeOpacity=".6"
        strokeWidth="1.4"
        fill="none"
      />
    </svg>
  );
}

/** Line drawing of the Tian Shan peaks (used on light backgrounds). */
export function MountainLines({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 180"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={cn('pointer-events-none', className)}
      aria-hidden
    >
      <path
        d="M0 176 L92 92 L128 120 L206 30 L262 96 L292 74 L420 176"
        strokeWidth="1.6"
        fill="currentColor"
        fillOpacity=".08"
      />
      <path d="M206 30 L196 62 L214 54 L206 84 M92 92 L86 116 L102 108" strokeWidth="1.2" />
      <path d="M262 96 L252 122 M292 74 L304 104 L320 112" strokeWidth="1.2" />
      <path d="M150 176 L232 112 L280 148 L340 104 L420 156" strokeWidth="1.2" strokeOpacity=".6" />
    </svg>
  );
}

/** Dark mountain silhouettes with a gold ridge line (footer background). */
export function MountainSilhouettes({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 220"
      preserveAspectRatio="xMidYMax slice"
      className={cn('pointer-events-none', className)}
      aria-hidden
    >
      <path
        d="M0 220 V150 L120 92 L190 126 L300 54 L380 112 L460 84 L560 140 L640 120 L760 46 L860 118 L940 96 L1060 30 L1150 104 L1230 80 L1330 126 L1440 70 V220 Z"
        fill="#1B3520"
      />
      <path
        d="M0 150 L120 92 L190 126 L300 54 L380 112 L460 84 L560 140 L640 120 L760 46 L860 118 L940 96 L1060 30 L1150 104 L1230 80 L1330 126 L1440 70"
        fill="none"
        stroke="#D9A85B"
        strokeOpacity=".35"
        strokeWidth="1.5"
      />
      <path
        d="M0 220 V186 L160 140 L280 170 L420 124 L560 176 L700 132 L840 168 L980 120 L1120 166 L1260 128 L1440 160 V220 Z"
        fill="#16301B"
      />
    </svg>
  );
}

/** Repeating band of ram's horns (bottom of the footer). */
export function OrnamentBand({ className }: { className?: string }) {
  return (
    <div
      className={cn('h-8 w-full', className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='32' viewBox='0 0 120 32'%3E%3Cg fill='none' stroke='%23D9A85B' stroke-opacity='.55' stroke-width='1.6' stroke-linecap='round'%3E%3Cpath d='M0 30 H120'/%3E%3Cpath d='M60 28 V17 C60 9 52 5 46 8 C40 11 41 19 47 19 C51 19 52 14 48 13'/%3E%3Cpath d='M60 17 C60 9 68 5 74 8 C80 11 79 19 73 19 C69 19 68 14 72 13'/%3E%3Cpath d='M0 28 C8 28 12 22 10 17 M120 28 C112 28 108 22 110 17'/%3E%3C/g%3E%3Cpath d='M30 24 L34 20 L38 24 L34 28 Z M90 24 L94 20 L98 24 L94 28 Z' fill='%23D9A85B' fill-opacity='.55'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'center bottom',
      }}
      aria-hidden
    />
  );
}

/**
 * Kyrgyz mountain landscape drawn as layered vectors (no photo): warm sky
 * with the sun, snowy Tian Shan peaks, green ridges melting into deep green.
 */
export function MountainLandscape({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 320"
      preserveAspectRatio="xMidYMax slice"
      className={cn('pointer-events-none', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="ml-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4E9B9" />
          <stop offset="0.55" stopColor="#E9DDBF" />
          <stop offset="1" stopColor="#B9C49A" />
        </linearGradient>
        <radialGradient id="ml-sun" cx="0.72" cy="0.42" r="0.35">
          <stop offset="0" stopColor="#FFF6D8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFF6D8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ml-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9DB3A4" />
          <stop offset="1" stopColor="#6F8F72" />
        </linearGradient>
        <linearGradient id="ml-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5E8452" />
          <stop offset="1" stopColor="#355B3E" />
        </linearGradient>
      </defs>
      <rect width="1440" height="320" fill="url(#ml-sky)" />
      <rect width="1440" height="320" fill="url(#ml-sun)" />
      <path
        d="M0 210 L110 150 L190 175 L300 92 L380 140 L470 110 L560 160 L660 70 L760 150 L850 118 L960 60 L1060 140 L1150 100 L1260 150 L1350 112 L1440 140 V320 H0 Z"
        fill="url(#ml-far)"
      />
      <path
        d="M300 92 L322 112 L310 110 L296 122 L284 108 Z M660 70 L686 96 L670 92 L656 108 L640 94 Z M960 60 L990 90 L972 86 L958 102 L940 88 Z M1150 100 L1170 118 L1158 116 L1146 126 L1134 116 Z"
        fill="#FAF8EF"
        opacity="0.9"
      />
      <path
        d="M0 250 C160 200 300 230 420 196 C560 158 700 222 840 194 C980 166 1120 214 1260 186 C1340 170 1400 182 1440 176 V320 H0 Z"
        fill="url(#ml-mid)"
      />
      <path
        d="M0 290 C200 254 380 276 560 252 C760 226 940 270 1120 248 C1260 232 1360 244 1440 238 V320 H0 Z"
        fill="#243D2B"
      />
    </svg>
  );
}
