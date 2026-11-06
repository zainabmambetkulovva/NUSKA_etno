'use client';

import { useEffect, useState } from 'react';

import type { PackagingModel } from '@nuska/types';
import { useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';

import { ProductImage } from './product-image';

import { OrnamentLoader } from '@/components/brand/ornament';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';

// three.js is loaded only when the visitor opens the 3D view.
const PackagingViewer = dynamic(() => import('@/components/three/packaging-viewer'), {
  ssr: false,
  loading: () => <Loader />,
});

function Loader() {
  const { t } = useI18n();
  return <OrnamentLoader label={t.common.loading} className="absolute inset-0 justify-center" />;
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Main product visual: photo, plus an interactive 3D packaging view when configured (TZ §6.4). */
export function ProductGallery({
  name,
  image,
  packaging3d,
}: {
  name: string;
  image: { url: string; alt: string | null } | null;
  packaging3d: PackagingModel | null;
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion() ?? false;
  const [mode, setMode] = useState<'photo' | '3d'>('photo');
  const [webgl, setWebgl] = useState(false);
  useEffect(() => setWebgl(supportsWebGL()), []);
  const can3d = Boolean(packaging3d) && webgl;

  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream-light shadow-card">
      {mode === '3d' && packaging3d ? (
        <div className="bg-ornament absolute inset-0" role="img" aria-label={`${name} — 3D`}>
          <PackagingViewer model={packaging3d} name={name} reducedMotion={reduce} />
          <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs text-ink-muted shadow-soft">
            {t.product.rotateHint}
          </span>
        </div>
      ) : (
        <ProductImage
          url={image?.url}
          alt={image?.alt}
          name={name}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          placeholderLabel={t.product.photoSoon}
          className="absolute inset-0"
        />
      )}
      {can3d && (
        <div
          className="absolute right-3 top-3 z-10 inline-flex rounded-full border border-cream-dark bg-white/90 p-0.5 text-xs font-semibold shadow-soft backdrop-blur"
          role="group"
        >
          {(['photo', '3d'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                'rounded-full px-3 py-1.5 transition',
                mode === value ? 'bg-brand text-cream-light' : 'text-ink-muted hover:text-brand'
              )}
            >
              {value === 'photo' ? t.product.viewPhoto : t.product.view3d}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
