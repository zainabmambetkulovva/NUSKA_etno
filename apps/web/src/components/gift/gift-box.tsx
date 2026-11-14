'use client';

import { Component, useEffect, useState, type ReactNode } from 'react';

import dynamic from 'next/dynamic';

import { KochkorMuyuz } from '@/components/brand/ornament';
import type { BoxItem } from '@/components/three/gift-box-scene';

const GiftBoxScene = dynamic(() => import('@/components/three/gift-box-scene'), { ssr: false });

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

/** 2D box for devices without WebGL: the chosen products as labels. */
function Fallback({ names }: { names: string[] }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="relative w-full max-w-sm rounded-2xl border-[10px] border-[#8A5A33] bg-cream p-4 shadow-card">
        <div className="absolute inset-x-0 -top-1 h-3 bg-brand" aria-hidden />
        <div className="flex min-h-[120px] flex-wrap content-center justify-center gap-2">
          {names.length === 0 ? (
            <KochkorMuyuz className="h-10 w-20 text-brand/40" />
          ) : (
            names.map((n, i) => (
              <span
                key={`${n}-${i}`}
                className="rounded-full bg-milk px-3 py-1 text-xs shadow-soft"
              >
                {n}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function GiftBox({
  items,
  names,
  label,
}: {
  items: BoxItem[];
  names: string[];
  label: string;
}) {
  const [mode, setMode] = useState<'pending' | '2d' | '3d'>('pending');
  const [lite, setLite] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let ok = false;
    try {
      const canvas = document.createElement('canvas');
      ok = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      ok = false;
    }
    setLite(window.matchMedia('(max-width: 767px), (pointer: coarse)').matches);
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setMode(ok ? '3d' : '2d');
  }, []);

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-cream-light to-beige/60"
      role="img"
      aria-label={`${label}: ${names.join(', ')}`}
    >
      {mode === '3d' ? (
        <Boundary fallback={<Fallback names={names} />}>
          <div className="absolute inset-0">
            <GiftBoxScene items={items} lite={lite} reducedMotion={reducedMotion} />
          </div>
        </Boundary>
      ) : (
        <Fallback names={names} />
      )}
    </div>
  );
}
