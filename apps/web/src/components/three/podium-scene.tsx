'use client';

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';

import { ContactShadows, Environment, Html, Lightformer } from '@react-three/drei';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

import { Bottle, Jar, NavatBox, Pack } from './packaging-viewer';

/**
 * Hero 3D: the company's packages stand on the podium of the hero picture and
 * turn slowly like a showcase. Hover shows the name and the current price from
 * the API; a click selects a product (its card is shown next to the scene).
 */

export type PodiumKey = 'kymyz' | 'bal' | 'sary-mai' | 'navat' | 'besh-barmak';

export interface PodiumProduct {
  name: string;
  price: string;
}

const ITEMS: { key: PodiumKey; fallback: string; render: (name: string) => ReactNode }[] = [
  { key: 'kymyz', fallback: 'Кымыз', render: (name) => <Bottle name={name} /> },
  {
    key: 'bal',
    fallback: 'Бал',
    render: (name) => <Jar name={name} body="#D99A2B" lid="#8A5A33" />,
  },
  { key: 'navat', fallback: 'Нават', render: (name) => <NavatBox name={name} /> },
  { key: 'sary-mai', fallback: 'Сары май', render: (name) => <Jar name={name} /> },
  { key: 'besh-barmak', fallback: 'Беш бармак', render: (name) => <Pack name={name} /> },
];

const damp = THREE.MathUtils.damp;
/** The products move on an ellipse that matches the flat podium top of the picture. */
const RADIUS_X = 2.35;
const RADIUS_Z = 1.0;
const SCALE = 0.5;

function Product({
  angle,
  phase,
  label,
  price,
  selected,
  onSelect,
  reducedMotion,
  children,
}: {
  angle: number;
  phase: { current: number };
  label: string;
  price?: string;
  selected: boolean;
  onSelect: () => void;
  reducedMotion: boolean;
  children: ReactNode;
}) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  useFrame((_, delta) => {
    const a = angle + phase.current;
    outer.current?.position.set(Math.sin(a) * RADIUS_X, 0, Math.cos(a) * RADIUS_Z);
    // Each package slowly turns too, so every side of the label is seen.
    outer.current?.rotation.set(0, a, 0);
    const g = inner.current;
    if (!g || reducedMotion) return;
    const lift = hovered || selected ? 0.12 : 0;
    g.position.y = damp(g.position.y, lift, 8, delta);
  });
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered]);

  return (
    <group ref={outer} position={[Math.sin(angle) * RADIUS_X, 0, Math.cos(angle) * RADIUS_Z]}>
      <group
        ref={inner}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => (e.stopPropagation(), setHovered(true))}
        onPointerOut={() => setHovered(false)}
        onClick={(e: ThreeEvent<MouseEvent>) => (e.stopPropagation(), onSelect())}
      >
        <group scale={SCALE} position={[0, SCALE, 0]}>
          {children}
        </group>
        {(hovered || selected) && (
          <Html
            position={[0, 1.25, 0]}
            center
            zIndexRange={[20, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <span className="flex flex-col items-center whitespace-nowrap rounded-lg bg-brand px-3 py-1.5 text-cream-light shadow-card">
              <span className="font-serif text-sm font-semibold">{label}</span>
              {price && <span className="text-xs text-cream/85">{price}</span>}
            </span>
          </Html>
        )}
      </group>
    </group>
  );
}

function Showcase({
  products,
  selected,
  onSelect,
  reducedMotion,
}: {
  products: Partial<Record<PodiumKey, PodiumProduct>>;
  selected: PodiumKey | null;
  onSelect: (key: PodiumKey | null) => void;
  reducedMotion: boolean;
}) {
  const phase = useRef(0);
  const items = ITEMS.filter((i) => products[i.key]);
  const shown = items.length > 0 ? items : ITEMS;
  useFrame((state, delta) => {
    if (reducedMotion) return;
    if (selected) {
      // Bring the chosen product to the front (angle 0 = nearest to the viewer).
      const index = shown.findIndex((i) => i.key === selected);
      const target = -(index / shown.length) * Math.PI * 2;
      const turns = Math.round((phase.current - target) / (Math.PI * 2));
      phase.current = damp(phase.current, target + turns * Math.PI * 2, 4, delta);
    } else {
      phase.current += delta * 0.16;
    }
    state.invalidate();
  });
  return (
    <group>
      {shown.map((item, i) => (
        <Product
          key={item.key}
          angle={(i / shown.length) * Math.PI * 2}
          phase={phase}
          label={products[item.key]?.name ?? item.fallback}
          price={products[item.key]?.price}
          selected={selected === item.key}
          reducedMotion={reducedMotion}
          onSelect={() => onSelect(selected === item.key ? null : item.key)}
        >
          {item.render(products[item.key]?.name ?? item.fallback)}
        </Product>
      ))}
    </group>
  );
}

export default function PodiumScene({
  products,
  selected,
  onSelect,
  reducedMotion,
  active,
  lite,
  onError,
}: {
  products: Partial<Record<PodiumKey, PodiumProduct>>;
  selected: PodiumKey | null;
  onSelect: (key: PodiumKey | null) => void;
  reducedMotion: boolean;
  active: boolean;
  lite: boolean;
  onError?: () => void;
}) {
  return (
    <Canvas
      frameloop={!active ? 'never' : reducedMotion ? 'demand' : 'always'}
      dpr={lite ? [1, 1.5] : [1, 1.75]}
      camera={{ position: [0, 1.05, 8.2], fov: 26 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: lite ? 'low-power' : 'high-performance',
      }}
      onCreated={({ gl, camera }) => {
        camera.lookAt(0, 0.62, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.domElement.addEventListener('webglcontextlost', () => onError?.(), { once: true });
      }}
      onPointerMissed={() => onSelect(null)}
      aria-hidden
    >
      <hemisphereLight args={['#FFF3D6', '#4D7A55', 0.75]} />
      <directionalLight position={[-3, 5, 4]} intensity={1.6} color="#FFE9C2" />
      <Suspense fallback={null}>
        <Environment resolution={lite ? 32 : 64} frames={1}>
          <Lightformer
            form="rect"
            intensity={2}
            color="#FFF4DC"
            position={[0, 4, 4]}
            scale={[8, 3, 1]}
          />
          <Lightformer
            form="rect"
            intensity={0.8}
            color="#F4E9B9"
            position={[-5, 2, -2]}
            scale={[4, 2, 1]}
          />
        </Environment>
        <Showcase
          products={products}
          selected={selected}
          onSelect={onSelect}
          reducedMotion={reducedMotion}
        />
        <ContactShadows
          position={[0, 0.002, 0]}
          opacity={0.35}
          scale={6}
          blur={2.2}
          far={1.5}
          frames={lite || reducedMotion ? 1 : Infinity}
          color="#3B3025"
        />
      </Suspense>
    </Canvas>
  );
}
