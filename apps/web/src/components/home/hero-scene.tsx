'use client';

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { ProductCard } from '@nuska/types';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import { AddToCartButton } from '@/components/product/add-to-cart-button';
import type { PodiumKey, PodiumProduct } from '@/components/three/podium-scene';
import { CloseIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';

const PodiumScene = dynamic(() => import('@/components/three/podium-scene'), { ssr: false });

/** Catalog SKU of each product on the podium. */
export const PODIUM_SKUS: Record<PodiumKey, string> = {
  kymyz: 'KYMYZ',
  bal: 'BAL',
  navat: 'NAVAT-0.5',
  'sary-mai': 'SARY-MAI',
  'besh-barmak': 'BESH-BARMAK',
};

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    this.props.onError();
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The podium of the hero picture with the 3D packages and, under it, product
 * buttons (they also select a product — keyboard and screen readers, and the
 * only way without WebGL). The card of the selected product shows the price
 * from the API and "Add to cart".
 */
export function HeroScene({ products = [] }: { products?: ProductCard[] }) {
  const { locale, t } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<PodiumKey | null>(null);
  const [webgl, setWebgl] = useState(false);
  const [lite, setLite] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(true);

  const byKey = useMemo(() => {
    const map: Partial<Record<PodiumKey, ProductCard>> = {};
    for (const [key, sku] of Object.entries(PODIUM_SKUS) as [PodiumKey, string][]) {
      const product = products.find((p) => p.sku === sku);
      if (product) map[key] = product;
    }
    return map;
  }, [products]);
  const labels = useMemo(() => {
    const map: Partial<Record<PodiumKey, PodiumProduct>> = {};
    for (const [key, p] of Object.entries(byKey) as [PodiumKey, ProductCard][])
      map[key] = { name: p.name, price: formatMoney(p.price, locale, t.common.som) };
    return map;
  }, [byKey, locale, t.common.som]);
  const current = selected ? byKey[selected] : undefined;

  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData;
    setWebgl(!saveData && supportsWebGL());
    setLite(
      window.matchMedia('(max-width: 767px), (pointer: coarse)').matches ||
        (navigator.hardwareConcurrency ?? 8) <= 4
    );
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const element = box.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setSelected(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const keys = (Object.keys(PODIUM_SKUS) as PodiumKey[]).filter((k) => byKey[k]);

  return (
    <>
      {/* The canvas is laid over the podium of the background picture. */}
      <div
        ref={box}
        className="absolute left-[18%] top-[44%] h-[56%] w-[64%]"
        role="img"
        aria-label={t.home.sceneLabel}
      >
        {webgl && (
          <SceneBoundary onError={() => setWebgl(false)}>
            <PodiumScene
              products={labels}
              selected={selected}
              onSelect={setSelected}
              reducedMotion={reducedMotion}
              active={visible}
              lite={lite}
              onError={() => setWebgl(false)}
            />
          </SceneBoundary>
        )}
      </div>

      {keys.length > 0 && (
        <div className="absolute inset-x-0 top-[calc(100%+10px)] z-10 flex justify-center px-3 md:bottom-3 md:top-auto">
          <div
            className="flex max-w-full gap-1.5 overflow-x-auto rounded-full bg-cream-light/85 p-1.5 shadow-card backdrop-blur [scrollbar-width:none]"
            role="group"
            aria-label={t.home.sceneHint}
          >
            {keys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(selected === key ? null : key)}
                aria-pressed={selected === key}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm',
                  selected === key ? 'bg-brand text-cream-light' : 'text-ink hover:bg-beige/60'
                )}
              >
                {byKey[key]!.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="absolute inset-x-3 top-[calc(100%+64px)] z-20 mx-auto flex max-w-[360px] items-center gap-4 rounded-2xl border border-gold/40 bg-cream-light/95 p-4 shadow-lift backdrop-blur md:inset-x-auto md:bottom-16 md:right-6 md:top-auto md:w-[360px]"
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
    </>
  );
}
