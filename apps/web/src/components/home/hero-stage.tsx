'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import dynamic from 'next/dynamic';

import { useMotionEnabled } from '@/components/motion/use-motion-enabled';

// three.js is fetched only on desktops with WebGL, after the page has loaded.
const HeroAtmosphere = dynamic(() => import('@/components/three/hero-atmosphere'), { ssr: false });

interface Stage {
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  progress: MotionValue<number>;
  still: boolean;
  enabled: MotionValue<number>;
}

const StageContext = createContext<Stage | null>(null);

function useStage() {
  const stage = useContext(StageContext);
  if (!stage) throw new Error('HeroLayer must be inside HeroStage');
  return stage;
}

/**
 * The hero as a small stage: it tracks the mouse (-1..1) and the scroll
 * progress through itself (0..1) and hands them to its layers and to the
 * WebGL atmosphere. With reduced motion nothing moves.
 */
export function HeroStage({
  children,
  className,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const pointerX = useSpring(rawX, { stiffness: 60, damping: 18 });
  const pointerY = useSpring(rawY, { stiffness: 60, damping: 18 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 26 });
  const enabled = useMotionEnabled();

  const move = (event: PointerEvent<HTMLElement>) => {
    if (reduce || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    rawX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    rawY.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };

  return (
    <StageContext.Provider value={{ pointerX, pointerY, progress, still: reduce, enabled }}>
      <section
        ref={ref}
        className={className}
        aria-labelledby={labelledBy}
        onPointerMove={move}
        onPointerLeave={() => {
          rawX.set(0);
          rawY.set(0);
        }}
      >
        {children}
      </section>
    </StageContext.Provider>
  );
}

/**
 * A layer of the hero at some depth: positive depth moves with the mouse,
 * negative against it (farther away). `zoom` scales it while scrolling toward
 * `origin`; `lift` moves it up; `fade` makes it disappear on scroll.
 */
export function HeroLayer({
  children,
  className,
  depth = 0,
  zoom = 0,
  lift = 0,
  fade = false,
  origin = '50% 50%',
}: {
  children: ReactNode;
  className?: string;
  depth?: number;
  zoom?: number;
  lift?: number;
  fade?: boolean;
  origin?: string;
}) {
  const { pointerX, pointerY, progress, enabled } = useStage();
  const x = useTransform(
    [pointerX, enabled],
    ([v, on]) => (v as number) * depth * 14 * (on as number)
  );
  const y = useTransform(
    [pointerY, progress, enabled],
    ([v, p, on]) => ((v as number) * depth * 9 - (p as number) * lift) * (on as number)
  );
  const scale = useTransform(
    [progress, enabled],
    ([p, on]) => 1 + (p as number) * zoom * (on as number)
  );
  const opacity = useTransform([progress, enabled], ([p, on]) =>
    fade ? Math.max(0, 1 - (p as number) * 1.8 * (on as number)) : 1
  );
  return (
    <motion.div className={className} style={{ x, y, scale, opacity, transformOrigin: origin }}>
      {children}
    </motion.div>
  );
}

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Loads the WebGL atmosphere on desktops (≥ 1024 px, fine pointer, WebGL,
 * no reduced motion) once the page is idle, and pauses it while the hero is
 * out of view. Phones keep the light CSS clouds and eagle.
 */
export function HeroAtmosphereSlot({
  className,
  children,
}: {
  className?: string;
  /** shown while the WebGL scene is not used (CSS clouds) */
  children?: ReactNode;
}) {
  const { pointerX, pointerY, progress, still } = useStage();
  const box = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (still) return;
    const desktop = window.matchMedia('(min-width: 1024px) and (pointer: fine)');
    if (!desktop.matches || !canUseWebGL()) return;
    const start = () => setEnabled(true);
    const idle = 'requestIdleCallback' in window;
    const handle = idle
      ? window.requestIdleCallback(start, { timeout: 2500 })
      : window.setTimeout(start, 1200);
    return () => (idle ? window.cancelIdleCallback(handle) : window.clearTimeout(handle));
  }, [still]);

  useEffect(() => {
    if (!enabled || !box.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.01,
    });
    observer.observe(box.current);
    return () => observer.disconnect();
  }, [enabled]);

  return (
    <div ref={box} className={className} data-hero-3d={enabled ? 'on' : 'off'} aria-hidden>
      {enabled ? (
        <HeroAtmosphere
          pointerX={pointerX}
          pointerY={pointerY}
          progress={progress}
          active={visible}
        />
      ) : (
        children
      )}
    </div>
  );
}
