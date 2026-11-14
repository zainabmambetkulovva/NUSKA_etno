'use client';

import { useEffect, useState } from 'react';

import type { PackagingModel } from '@nuska/types';
import { useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';

import { ProductImage } from './product-image';

import { OrnamentLoader } from '@/components/brand/ornament';
import { Tilt } from '@/components/motion/tilt';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';
import { companyPhoto } from '@/lib/product-photos';

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
  slug,
  image,
  packaging3d,
}: {
  name: string;
  slug: string;
  image: { url: string; alt: string | null } | null;
  packaging3d: PackagingModel | null;
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion() ?? false;
  const [mode, setMode] = useState<'photo' | '3d'>('photo');
  const [zoom, setZoom] = useState(1);
  const [webgl, setWebgl] = useState(false);
  useEffect(() => setWebgl(supportsWebGL()), []);
  const can3d = Boolean(packaging3d) && webgl;
  // the company's package photos (transparent background) float on a wooden stand
  const showcase = !image?.url && Boolean(companyPhoto(slug));

  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_35%,#FFF9EC,#F3E2C2)] shadow-card">
      {mode === '3d' && packaging3d ? (
        <div className="bg-ornament absolute inset-0" role="img" aria-label={`${name} — 3D`}>
          <PackagingViewer model={packaging3d} name={name} reducedMotion={reduce} zoom={zoom} />
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2">
            {(
              [
                [t.product.zoomIn, '+', 0.25],
                [t.product.zoomOut, '−', -0.25],
              ] as const
            ).map(([label, sign, step]) => (
              <button
                key={sign}
                type="button"
                onClick={() => setZoom((z) => Math.min(2, Math.max(0.75, z + step)))}
                disabled={(step > 0 && zoom >= 2) || (step < 0 && zoom <= 0.75)}
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl text-brand shadow-soft transition hover:bg-white disabled:opacity-40"
              >
                {sign}
              </button>
            ))}
          </div>
          <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs text-ink-muted shadow-soft">
            {t.product.rotateHint}
          </span>
        </div>
      ) : showcase ? (
        <Tilt className="group relative h-full w-full" max={6}>
          {/* wooden stand with a breathing shadow under the floating package */}
          <span
            aria-hidden
            className="absolute bottom-[9%] left-1/2 h-[9%] w-[58%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_50%_40%,#D9B07A,#A97546_70%,#7E5230)] shadow-[0_18px_30px_-12px_rgba(60,35,15,0.55)]"
          />
          <span
            aria-hidden
            className="absolute bottom-[12%] left-1/2 h-[5%] w-[40%] -translate-x-1/2 rounded-[50%] bg-black/25 blur-md motion-safe:animate-shadow-breathe"
          />
          <div className="absolute inset-x-[10%] bottom-[15%] top-[6%] motion-safe:animate-float [animation-duration:5.5s]">
            <ProductImage
              url={image?.url}
              slug={slug}
              alt={image?.alt}
              name={name}
              priority
              sizes="(min-width: 1024px) 40vw, 80vw"
              placeholderLabel={t.product.photoSoon}
              bare
              className="h-full w-full !overflow-visible"
            />
          </div>
        </Tilt>
      ) : (
        <ProductImage
          url={image?.url}
          slug={slug}
          alt={image?.alt}
          name={name}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          placeholderLabel={t.product.photoSoon}
          className="h-full w-full"
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
