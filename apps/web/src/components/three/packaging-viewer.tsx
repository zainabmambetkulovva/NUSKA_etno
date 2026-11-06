'use client';

import { Suspense, useEffect, useMemo, type ReactElement } from 'react';

import type { PackagingModel } from '@nuska/types';
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  RoundedBox,
} from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import { seeded } from './procedural';

import { HORN_PATHS } from '@/components/brand/ornament';

/**
 * Interactive 3D packaging on the product page (TZ §6.4). Models are built in
 * code after the company's real packages (Instagram photos); the label shows
 * the product name in the current language. Drag to rotate; it turns slowly on
 * its own unless the user prefers reduced motion.
 */

interface LabelStyle {
  background: [string, string];
  text: string;
  accent: string;
}

function drawHorn(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(-60, -30);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  HORN_PATHS.forEach((d) => ctx.stroke(new Path2D(d)));
  ctx.restore();
}

/**
 * Label texture: brand, ornament and the product name. The canvas has the same
 * aspect ratio as the label surface, so nothing is stretched. On wrap-around
 * labels (bottle, jar) the text is kept within `maxTextWidth` around the
 * centre, which faces the viewer.
 */
function createLabel(
  name: string,
  style: LabelStyle,
  width: number,
  height: number,
  maxTextWidth = width - 120
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const k = height / 512;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, style.background[0]);
  gradient.addColorStop(1, style.background[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Ornamental borders
  ctx.fillStyle = style.accent;
  ctx.fillRect(0, 18 * k, width, 10 * k);
  ctx.fillRect(0, height - 28 * k, width, 10 * k);
  for (let x = 40 * k; x < width; x += 120 * k) {
    drawHorn(ctx, x, 62 * k, 0.5 * k, style.accent);
    drawHorn(ctx, x + 60 * k, height - 62 * k, 0.5 * k, style.accent);
  }

  const cx = width / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = style.accent;
  ctx.font = `600 ${44 * k}px Georgia, serif`;
  ctx.fillText('Nuska', cx, height * 0.3);

  ctx.fillStyle = style.text;
  let size = 120 * k;
  ctx.font = `700 ${size}px Georgia, serif`;
  while (ctx.measureText(name).width > maxTextWidth && size > 30 * k) {
    size -= 4 * k;
    ctx.font = `700 ${size}px Georgia, serif`;
  }
  ctx.fillText(name, cx, height * 0.56);

  ctx.font = `500 ${28 * k}px Arial, sans-serif`;
  ctx.fillText('eco-ethno product', cx, height * 0.78);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Turns a wrap-around label so its centre (u = 0.5) faces the default camera. */
const FACE_CAMERA = Math.PI + Math.atan2(2.6, 3.8);

/** Diamond quilting of the kymyz bottle, as a bump map. */
function createQuiltBump() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 10;
  for (let i = -256; i <= 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 256, 256);
    ctx.moveTo(i, 256);
    ctx.lineTo(i + 256, 0);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 3);
  return texture;
}

function useDisposable<T extends { dispose: () => void }>(factory: () => T, deps: unknown[]) {
  const value = useMemo(factory, deps);
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

function Bottle({ name }: { name: string }) {
  const label = useDisposable(
    () =>
      createLabel(
        name,
        { background: ['#F6C342', '#E8743B'], text: '#B4442F', accent: '#2D5BA8' },
        2048,
        476,
        760
      ),
    [name]
  );
  const bump = useDisposable(createQuiltBump, []);
  const body = useMemo(() => {
    const points = [
      [0.001, 0],
      [0.36, 0],
      [0.4, 0.06],
      [0.42, 0.2],
      [0.42, 1.05],
      [0.4, 1.25],
      [0.33, 1.5],
      [0.22, 1.72],
      [0.15, 1.82],
      [0.15, 1.95],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.LatheGeometry(points, 64);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group position={[0, -1, 0]}>
      <mesh geometry={body} castShadow>
        <meshPhysicalMaterial
          color="#FBFBF7"
          roughness={0.32}
          clearcoat={0.6}
          bumpMap={bump}
          bumpScale={0.6}
        />
      </mesh>
      <mesh position={[0, 0.62, 0]} rotation-y={FACE_CAMERA}>
        <cylinderGeometry args={[0.425, 0.425, 0.62, 64, 1, true]} />
        <meshStandardMaterial map={label} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 2.03, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.2, 32]} />
        <meshStandardMaterial color="#D8322B" roughness={0.45} />
      </mesh>
    </group>
  );
}

function Jar({ name }: { name: string }) {
  const label = useDisposable(
    () =>
      createLabel(
        name,
        { background: ['#F7D648', '#F2C232'], text: '#27452F', accent: '#355B3E' },
        2048,
        324,
        640
      ),
    [name]
  );
  return (
    <group position={[0, -0.75, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 1.1, 64]} />
        <meshPhysicalMaterial color="#F1C84B" roughness={0.35} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation-y={FACE_CAMERA}>
        <cylinderGeometry args={[0.606, 0.606, 0.6, 64, 1, true]} />
        <meshStandardMaterial map={label} roughness={0.45} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.63, 0.63, 0.22, 64]} />
        <meshStandardMaterial color="#1E1E1E" roughness={0.35} metalness={0.2} />
      </mesh>
    </group>
  );
}

function NavatBox({ name }: { name: string }) {
  const label = useDisposable(
    () =>
      createLabel(
        name,
        { background: ['#FFE07A', '#F6B23C'], text: '#B4442F', accent: '#7A4A1E' },
        1024,
        512
      ),
    [name]
  );
  const crystals = useMemo(() => {
    const rand = seeded(11);
    // Kept inside the 1.8 × 0.75 × 1.15 box.
    return Array.from({ length: 38 }, () => ({
      position: [(rand() - 0.5) * 1.3, -0.24 + rand() * 0.3, (rand() - 0.5) * 0.7] as [
        number,
        number,
        number,
      ],
      rotation: [rand() * 3, rand() * 3, rand() * 3] as [number, number, number],
      scale: 0.07 + rand() * 0.08,
    }));
  }, []);
  return (
    <group position={[0, -0.66, 0]}>
      {crystals.map((c, i) => (
        <mesh key={i} position={c.position} rotation={c.rotation} scale={c.scale} castShadow>
          <octahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial
            color="#F39A3D"
            roughness={0.2}
            transmission={0.4}
            thickness={0.4}
          />
        </mesh>
      ))}
      <RoundedBox args={[1.8, 0.75, 1.15]} radius={0.06} smoothness={4}>
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.22}
          roughness={0.08}
          clearcoat={1}
        />
      </RoundedBox>
      <mesh position={[0.25, 0.38, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.95, 0.48]} />
        <meshStandardMaterial map={label} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Pack({ name }: { name: string }) {
  const label = useDisposable(
    () =>
      createLabel(
        name,
        { background: ['#FFF4D6', '#F6D58A'], text: '#C0392B', accent: '#C0392B' },
        872,
        1024,
        760
      ),
    [name]
  );
  return (
    <group rotation={[0, 0, 0]}>
      <RoundedBox args={[1.5, 1.9, 0.32]} radius={0.12} smoothness={6} castShadow>
        <meshStandardMaterial color="#E8D3A0" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, -0.05, 0.165]}>
        <planeGeometry args={[1.32, 1.55]} />
        <meshStandardMaterial map={label} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[1.3, 0.1, 0.06]} />
        <meshStandardMaterial color="#C0392B" roughness={0.5} />
      </mesh>
    </group>
  );
}

const MODELS: Record<PackagingModel, (props: { name: string }) => ReactElement> = {
  BOTTLE: Bottle,
  JAR: Jar,
  BOX: NavatBox,
  PACK: Pack,
};

export default function PackagingViewer({
  model,
  name,
  reducedMotion,
}: {
  model: PackagingModel;
  name: string;
  reducedMotion: boolean;
}) {
  const Model = MODELS[model];
  return (
    <Canvas
      frameloop={reducedMotion ? 'demand' : 'always'}
      dpr={[1, 1.75]}
      shadows
      camera={{ position: [2.6, 1.6, 3.8], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
    >
      <hemisphereLight args={['#FFF6DD', '#27452F', 0.6]} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Suspense fallback={null}>
        <Environment resolution={64} frames={1}>
          <Lightformer
            form="rect"
            intensity={2}
            color="#FFF4DC"
            position={[0, 4, 3]}
            scale={[6, 3, 1]}
          />
          <Lightformer
            form="rect"
            intensity={0.8}
            color="#F4E9B9"
            position={[-4, 1, -2]}
            rotation-y={Math.PI / 3}
            scale={[4, 2, 1]}
          />
        </Environment>
        <Model name={name} />
        <ContactShadows
          position={[0, -1.05, 0]}
          opacity={0.4}
          scale={6}
          blur={2.4}
          far={2.5}
          frames={1}
          color="#27452F"
        />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={!reducedMotion}
        autoRotateSpeed={1.2}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.9}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
