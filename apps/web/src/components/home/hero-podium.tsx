'use client';

import { useEffect, useRef, useState } from 'react';

import dynamic from 'next/dynamic';

const HeroPodiumScene = dynamic(() => import('@/components/three/hero-podium-scene'), {
  ssr: false,
});

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Loads the 3D podium only in the browser, only with WebGL, and renders it
 * only while the hero is visible (and the tab is shown). Phones get a lighter
 * scene; with reduced motion the composition stands still.
 */
export function HeroPodium({ label, className }: { label: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lite, setLite] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (!supportsWebGL()) return;
    setLite(window.matchMedia('(max-width: 768px)').matches || navigator.hardwareConcurrency <= 4);
    setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setReady(true);
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (box.current) io.observe(box.current);
    const onVisibility = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div ref={box} className={className} role="img" aria-label={label}>
      {ready && <HeroPodiumScene lite={lite} still={still} active={visible} />}
    </div>
  );
}
