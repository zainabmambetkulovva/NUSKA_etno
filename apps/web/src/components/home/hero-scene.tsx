'use client';

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { ProductCard } from '@nuska/types';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import { HeroVisual } from './hero-visual';

import { AddToCartButton } from '@/components/product/add-to-cart-button';
import type { SceneKey, SceneProduct } from '@/components/three/dastorkon-scene';
import { CloseIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { formatMoney } from '@/lib/format';

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

/** Catalog SKU of each product shown on the dastorkon. */
export const SCENE_SKUS: Record<SceneKey, string> = {
  kattama: 'KATTAMA',
  kymyz: 'KYMYZ',
  bal: 'BAL',
  navat: 'NAVAT-0.5',
  'sary-mai': 'SARY-MAI',
  zhupka: 'ZHUPKA',
};

/**
 * Hero visual: the interactive 3D dastorkon when the device can afford it,
 * otherwise (no WebGL, Save-Data, render error) the lightweight 2D composition.
 */
export function HeroScene({ products = [] }: { products?: ProductCard[] }) {
  const { locale, t } = useI18n();
  const [selected, setSelected] = useState<SceneKey | null>(null);
  const byKey = useMemo(() => {
    const map: Partial<Record<SceneKey, ProductCard>> = {};
    for (const [key, sku] of Object.entries(SCENE_SKUS) as [SceneKey, string][]) {
      const product = products.find((p) => p.sku === sku);
      if (product) map[key] = product;
    }
    return map;
  }, [products]);
  const labels = useMemo(() => {
    const map: Partial<Record<SceneKey, SceneProduct>> = {};
    for (const [key, product] of Object.entries(byKey) as [SceneKey, ProductCard][]) {
      map[key] = { name: product.name, price: formatMoney(product.price, locale, t.common.som) };
    }
    return map;
  }, [byKey, locale, t.common.som]);
  const current = selected ? byKey[selected] : undefined;

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setSelected(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);
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
          <div className="scene-fade absolute inset-0" role="img" aria-label={t.home.sceneLabel}>
            <DastorkonScene
              lite={lite}
              reducedMotion={reducedMotion}
              active={visible && tabVisible}
              locale={locale}
              onError={() => setMode('2d')}
              products={labels}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
        </SceneBoundary>
      ) : (
        <HeroVisual />
      )}
      <AnimatePresence>
        {mode === '3d' && current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="absolute inset-x-4 bottom-4 z-10 flex items-center gap-4 rounded-2xl border border-cream-dark/60 bg-milk/95 p-4 shadow-lift backdrop-blur"
            role="dialog"
            aria-label={current.name}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-lg font-semibold">{current.name}</p>
              <p className="text-brand">{formatMoney(current.price, locale, t.common.som)}</p>
              <Link
                href={`/${locale}/product/${current.slug}`}
                className="text-sm text-ink-muted underline-offset-2 hover:text-brand hover:underline"
              >
                {t.home.sceneMore}
              </Link>
            </div>
            <AddToCartButton product={current} size="sm" />
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-cream-light shadow-card"
              aria-label={t.common.close}
            >
              <CloseIcon width={16} height={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
