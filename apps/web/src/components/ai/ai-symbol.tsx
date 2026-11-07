'use client';

import { Component, useEffect, useState, type ReactNode } from 'react';

import dynamic from 'next/dynamic';

import { NuskaOrb } from './nuska-orb';

import { cn } from '@/lib/cn';

const AiOrbScene = dynamic(() => import('@/components/three/ai-orb-scene'), {
  ssr: false,
  loading: () => <NuskaOrb className="h-full w-full p-8" />,
});

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

/** 3D brand symbol of NUSKA AI; the SVG orb without WebGL. */
export function AiSymbol({ className }: { className?: string }) {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      setWebgl(Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')));
    } catch {
      setWebgl(false);
    }
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  const fallback = <NuskaOrb className="h-full w-full p-8" />;
  return (
    <div className={cn('relative', className)} data-testid="ai-symbol">
      {webgl ? (
        <Boundary fallback={fallback}>
          <AiOrbScene reducedMotion={reducedMotion} />
        </Boundary>
      ) : (
        fallback
      )}
    </div>
  );
}
