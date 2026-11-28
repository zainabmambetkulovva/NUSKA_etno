'use client';

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';

import { layerY, type DishLayerKind } from './dish-layers';

import { cn } from '@/lib/cn';
import { canUseWebGL, lowPowerDevice } from '@/lib/device';

const DishScene = dynamic(() => import('@/components/three/dish-scene'), { ssr: false });

class Boundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Colours of the flat picture used without WebGL. */
const FLAT: Record<DishLayerKind, string> = {
  plate: '#F7F1E3',
  saucer: '#F7F1E3',
  noodles: '#EAD7A4',
  meat: '#8A4B2A',
  onion: '#F4EEDD',
  broth: '#D9A54A',
  kattama: '#C98A3F',
  butter: '#F3C64F',
  honey: '#D98E1C',
  piala: '#FBF6EA',
  tea: '#7A3B12',
  navat: '#F6E7C4',
  zhupka: '#C98A4B',
  cloth: '#F6EDC6',
  ayak: '#8A5A33',
  kymyz: '#F3EEE2',
};

/** Approximate screen position of a layer (used before the 3D scene measures it). */
const guess = (i: number, n: number) => 0.5 - layerY(i, n) / 4.3;

/**
 * The dish in an exploded view: its parts float one above another, turn
 * slowly, and every part has its name in a card beside it. The 3D scene is
 * loaded only near the screen; without WebGL a flat picture is shown, with
 * reduced motion the scene stands still.
 */
export function DishVisual({
  layers,
  labels,
  label,
}: {
  layers: DishLayerKind[];
  /** names of the parts, bottom → top */
  labels: string[];
  /** accessible name of the picture */
  label: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const [mode, setMode] = useState<'pending' | 'flat' | '3d'>('pending');
  const [visible, setVisible] = useState(false);
  const [tops, setTops] = useState(() => layers.map((_, i) => guess(i, layers.length)));
  const onLayout = useCallback((next: number[]) => setTops(next), []);

  useEffect(() => {
    if (!box.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting)
          setMode((m) =>
            m === 'pending' ? (canUseWebGL() && !lowPowerDevice() ? '3d' : 'flat') : m
          );
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);

  const flat = (
    <div className="absolute inset-0" aria-hidden>
      {layers.map((kind, i) => (
        <span
          key={`${kind}-${i}`}
          className="absolute left-1/2 h-[9%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] shadow-[0_10px_20px_-10px_rgba(0,0,0,0.6)]"
          style={{ top: `${guess(i, layers.length) * 100}%`, background: FLAT[kind] }}
        />
      ))}
    </div>
  );

  return (
    <div
      ref={box}
      role="img"
      aria-label={`${label}: ${[...labels].reverse().join(', ')}`}
      className="relative h-full min-h-[22rem] w-full"
      data-dish={mode}
    >
      {/* warm light behind the dish */}
      <div
        className="absolute left-1/2 top-1/2 h-[80%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(199,166,106,0.35),transparent)]"
        aria-hidden
      />
      <div className="absolute inset-x-[14%] inset-y-0 sm:inset-x-[18%]">
        {mode === '3d' ? (
          <Boundary fallback={flat}>
            <DishScene layers={layers} active={visible} still={reduce} onLayout={onLayout} />
          </Boundary>
        ) : mode === 'flat' ? (
          flat
        ) : null}
      </div>

      <ul className="pointer-events-none absolute inset-0" aria-hidden>
        {labels.map((name, i) => {
          const left = i % 2 === 1;
          return (
            <li
              key={name}
              className={cn(
                'absolute flex w-1/2 -translate-y-1/2 items-center transition-[top] duration-500',
                left ? 'left-0 flex-row' : 'right-0 flex-row-reverse'
              )}
              style={{ top: `${(tops[i] ?? guess(i, labels.length)) * 100}%` }}
            >
              <span className="relative z-10 max-w-[62%] rounded-xl border border-nk-gold/50 bg-nk-cream/95 px-2.5 py-1.5 text-[11px] font-semibold leading-tight text-nk-ink shadow-[0_10px_24px_-12px_rgba(0,0,0,0.7)] backdrop-blur sm:px-3.5 sm:py-2 sm:text-sm">
                <span className="mr-1.5 font-serif text-nk-gold">
                  {String(labels.length - i).padStart(2, '0')}
                </span>
                {name}
              </span>
              <span
                className={cn(
                  'h-px flex-1 border-t border-dashed border-nk-gold/70',
                  left ? 'mr-[22%]' : 'ml-[22%]'
                )}
              />
              <span
                className={cn(
                  'absolute h-2 w-2 rounded-full bg-nk-gold shadow-[0_0_0_4px_rgba(199,166,106,0.25)]',
                  left ? 'right-[22%] translate-x-1/2' : 'left-[22%] -translate-x-1/2'
                )}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
