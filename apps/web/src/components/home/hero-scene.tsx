'use client';

import { Component, useEffect, useRef, useState, type ReactNode } from 'react';

import dynamic from 'next/dynamic';

import { HeroVisual } from './hero-visual';

import { useI18n } from '@/i18n/i18n-provider';

// three.js and the scene are a separate chunk, loaded only when needed (TZ §7.7 lazy loading).
const DastorkonScene = dynamic(() => import('@/components/three/dastorkon-scene'), {
  ssr: false,
  loading: () => <HeroVisual />,
});

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

class SceneBoundary extends Component<
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

type Mode = 'pending' | '2d' | '3d';

/**
 * Hero visual: the interactive 3D dastorkon when the device can afford it,
 * otherwise (no WebGL, Save-Data, render error) the lightweight 2D composition.
 */
export function HeroScene() {
  const { locale, t } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('pending');
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [lite, setLite] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    if (connection?.saveData || !supportsWebGL()) {
      setMode('2d');
      return;
    }
    setLite(
      window.matchMedia('(max-width: 767px), (pointer: coarse)').matches ||
        (navigator.hardwareConcurrency ?? 8) <= 4
    );
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motion.matches);
    const onMotion = () => setReducedMotion(motion.matches);
    motion.addEventListener('change', onMotion);

    // Start loading the 3D chunk after the page is interactive, so it never delays the text and buttons.
    const start = () => setMode('3d');
    const idle = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      }
    ).requestIdleCallback;
    const handle = idle ? idle(start, { timeout: 2000 }) : window.setTimeout(start, 600);
    return () => {
      motion.removeEventListener('change', onMotion);
      if (!idle) window.clearTimeout(handle);
    };
  }, []);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: '100px',
    });
    observer.observe(element);
    const onVisibility = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div ref={box} className="relative mx-auto aspect-square w-full max-w-[560px]">
      {mode === '3d' ? (
        <SceneBoundary fallback={<HeroVisual />}>
          <div className="absolute inset-0" role="img" aria-label={t.home.sceneLabel}>
            <DastorkonScene
              lite={lite}
              reducedMotion={reducedMotion}
              active={visible && tabVisible}
              locale={locale}
              onError={() => setMode('2d')}
            />
          </div>
        </SceneBoundary>
      ) : (
        <HeroVisual />
      )}
    </div>
  );
}
