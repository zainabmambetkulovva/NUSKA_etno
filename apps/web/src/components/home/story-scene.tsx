'use client';

import { Component, useEffect, useRef, useState, type ReactNode } from 'react';

import dynamic from 'next/dynamic';

import { KochkorMuyuz } from '@/components/brand/ornament';

const YurtScene = dynamic(() => import('@/components/three/yurt-scene'), { ssr: false });

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

function Fallback() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-cream-light to-beige">
      <svg viewBox="0 0 400 220" className="absolute inset-x-0 bottom-0 w-full" aria-hidden>
        <path
          d="M0 220 L70 90 L120 150 L190 50 L260 140 L320 80 L400 160 L400 220 Z"
          fill="#4D7A55"
        />
        <path d="M170 86 L190 50 L210 86 Z" fill="#FBF6E3" />
        <path d="M0 220 L0 180 Q200 150 400 185 L400 220 Z" fill="#9DAA6F" />
      </svg>
      <KochkorMuyuz className="absolute left-1/2 top-1/3 h-12 w-24 -translate-x-1/2 text-brand/40" />
    </div>
  );
}

/**
 * Loads the yurt scene only when the section comes close to the viewport
 * (it is below the first screen) and the device supports WebGL.
 */
export function StoryScene({ label }: { label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
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
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData;
    setWebgl(ok && !saveData);
    setLite(
      window.matchMedia('(max-width: 767px), (pointer: coarse)').matches ||
        (navigator.hardwareConcurrency ?? 8) <= 4
    );
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    const element = box.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: '300px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={box}
      className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-card"
      role="img"
      aria-label={label}
    >
      <Fallback />
      {webgl && near && (
        <Boundary fallback={null}>
          <div className="absolute inset-0">
            <YurtScene lite={lite} reducedMotion={reducedMotion} active={visible} />
          </div>
        </Boundary>
      )}
    </div>
  );
}
