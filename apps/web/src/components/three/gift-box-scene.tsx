'use client';

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type ReactElement } from 'react';

import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  RoundedBox,
} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { HORN_PATHS } from '@/components/brand/horn-paths';

/**
 * 3D gift box of the set builder (TZ section 08). Every chosen product appears
 * inside the box as a small model of its packaging (up to 3 copies per line);
 * the box turns slowly and can be rotated by dragging.
 */

export interface BoxItem {
  sku: string;
  quantity: number;
}

const damp = THREE.MathUtils.damp;

function bandTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#355B3E';
  ctx.fillRect(0, 0, 1024, 128);
  ctx.strokeStyle = '#E2CFA4';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let x = 4; x < 1024; x += 128) {
    ctx.save();
    ctx.translate(x, 34);
    HORN_PATHS.forEach((d) => ctx.stroke(new Path2D(d)));
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// --- Mini products ------------------------------------------------------------

const Std = (props: THREE.MeshStandardMaterialParameters) => (
  <meshStandardMaterial roughness={0.45} {...props} />
);

function Bottle({ color = '#FBFBF7', cap = '#D8322B' }: { color?: string; cap?: string }) {
  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.14, 0.6, 24]} />
        <Std color={color} />
      </mesh>
      <mesh position={[0, 0.66, 0]}>
        <cylinderGeometry args={[0.05, 0.1, 0.14, 16]} />
        <Std color={color} />
      </mesh>
      <mesh position={[0, 0.76, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.07, 16]} />
        <Std color={cap} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.142, 0.142, 0.2, 24, 1, true]} />
        <Std color="#F6C342" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Jar({ body, lid }: { body: string; lid: string }) {
  return (
    <group>
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.34, 28]} />
        <meshPhysicalMaterial color={body} roughness={0.25} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.07, 28]} />
        <Std color={lid} metalness={0.2} />
      </mesh>
    </group>
  );
}

function NavatBox() {
  return (
    <group>
      <RoundedBox args={[0.5, 0.24, 0.34]} radius={0.03} position={[0, 0.12, 0]} castShadow>
        <meshPhysicalMaterial color="#FFE7A6" transparent opacity={0.55} roughness={0.1} />
      </RoundedBox>
      {[-0.13, 0, 0.13].map((x, i) => (
        <mesh key={x} position={[x, 0.12, (i - 1) * 0.05]} rotation={[i, i * 2, 0.4]}>
          <octahedronGeometry args={[0.07, 0]} />
          <Std color="#F39A3D" roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function Flat({ color, layers = 1 }: { color: string; layers?: number }) {
  return (
    <group>
      {Array.from({ length: layers }, (_, i) => (
        <mesh key={i} position={[0, 0.03 + i * 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.045, 28]} />
          <Std color={color} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Pack() {
  return (
    <RoundedBox args={[0.34, 0.46, 0.1]} radius={0.04} position={[0, 0.23, 0]} castShadow>
      <Std color="#E8D3A0" roughness={0.6} />
    </RoundedBox>
  );
}

function Container() {
  return (
    <RoundedBox args={[0.42, 0.18, 0.3]} radius={0.03} position={[0, 0.09, 0]} castShadow>
      <meshPhysicalMaterial color="#F2E6D0" transparent opacity={0.8} roughness={0.2} />
    </RoundedBox>
  );
}

function Parcel() {
  return (
    <group>
      <RoundedBox args={[0.32, 0.26, 0.32]} radius={0.03} position={[0, 0.13, 0]} castShadow>
        <Std color="#C7A76C" roughness={0.7} />
      </RoundedBox>
      <mesh position={[0, 0.13, 0]}>
        <boxGeometry args={[0.06, 0.27, 0.33]} />
        <Std color="#B4442F" />
      </mesh>
    </group>
  );
}

/** Model of a product by its SKU (packaging as on the company's photos). */
function modelFor(sku: string): () => ReactElement {
  if (sku.startsWith('KYMYZ')) return () => <Bottle />;
  if (sku.startsWith('KEREMET')) return () => <Bottle color="#E9F2E2" cap="#355B3E" />;
  if (sku.startsWith('NAVAT')) return NavatBox;
  if (sku.startsWith('SARY-MAI')) return () => <Jar body="#F1C84B" lid="#1E1E1E" />;
  if (sku.startsWith('BAL')) return () => <Jar body="#E3A23B" lid="#8A5A33" />;
  if (sku.startsWith('KATTAMA')) return () => <Flat color="#D9A55B" layers={2} />;
  if (sku.startsWith('ZHUPKA')) return () => <Flat color="#E8C27E" layers={4} />;
  if (sku.startsWith('BESH-BARMAK')) return Pack;
  if (sku.startsWith('KHOLODETS')) return Container;
  return Parcel;
}

/** Each model pops in when it is added. */
function Pop({
  position,
  children,
}: {
  position: [number, number, number];
  children: ReactElement;
}) {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    ref.current?.scale.setScalar(0.01);
  }, []);
  useFrame((_, delta) => {
    const g = ref.current;
    if (g && g.scale.x < 0.999) g.scale.setScalar(damp(g.scale.x, 1, 9, delta));
  });
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}

const INNER_W = 2.1;
const INNER_D = 1.3;

function Box({ items }: { items: BoxItem[] }) {
  const band = useMemo(bandTexture, []);
  useEffect(() => () => band.dispose(), [band]);

  // Up to 3 copies per product, at most 15 models, laid out in rows of 5.
  const models = useMemo(() => {
    const list: { key: string; sku: string }[] = [];
    for (const item of items)
      for (let i = 0; i < Math.min(item.quantity, 3); i++)
        list.push({ key: `${item.sku}-${i}`, sku: item.sku });
    return list.slice(0, 15);
  }, [items]);
  const cols = 5;
  const rows = Math.max(1, Math.ceil(models.length / cols));

  return (
    <group position={[0, -0.55, 0]}>
      {/* Box: bottom, walls with an ornament band, cream lining */}
      <RoundedBox args={[2.4, 0.08, 1.6]} radius={0.03} position={[0, 0.04, 0]} receiveShadow>
        <Std color="#8A5A33" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.085, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[2.3, 1.5]} />
        <Std color="#F4E9B9" roughness={0.95} />
      </mesh>
      {(
        [
          [0, 0.3, 0.78, 2.4, 0.08],
          [0, 0.3, -0.78, 2.4, 0.08],
        ] as const
      ).map(([x, y, z, w, d]) => (
        <group key={z}>
          <mesh position={[x, y, z]} castShadow>
            <boxGeometry args={[w, 0.5, d]} />
            <Std color="#8A5A33" roughness={0.6} />
          </mesh>
          <mesh position={[x, y, z + Math.sign(z) * 0.041]} rotation-y={z < 0 ? Math.PI : 0}>
            <planeGeometry args={[w, 0.16]} />
            <Std map={band} />
          </mesh>
        </group>
      ))}
      {[-1.16, 1.16].map((x) => (
        <mesh key={x} position={[x, 0.3, 0]} castShadow>
          <boxGeometry args={[0.08, 0.5, 1.5]} />
          <Std color="#8A5A33" roughness={0.6} />
        </mesh>
      ))}
      {/* Lid leaning behind the box */}
      <group position={[0, 0.75, -1.05]} rotation-x={-0.35}>
        <RoundedBox args={[2.5, 1.1, 0.06]} radius={0.03}>
          <Std color="#355B3E" roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, 0, 0.032]}>
          <planeGeometry args={[2.5, 0.2]} />
          <Std map={band} />
        </mesh>
      </group>

      {models.map((m, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = -INNER_W / 2 + (INNER_W / cols) * (col + 0.5);
        const z = -INNER_D / 2 + (INNER_D / rows) * (row + 0.5);
        const Model = modelFor(m.sku);
        return (
          <Pop key={m.key} position={[x, 0.09, z]}>
            <Model />
          </Pop>
        );
      })}
    </group>
  );
}

export default function GiftBoxScene({
  items,
  reducedMotion,
  lite,
}: {
  items: BoxItem[];
  reducedMotion: boolean;
  lite: boolean;
}) {
  return (
    <Canvas
      frameloop={reducedMotion ? 'demand' : 'always'}
      dpr={lite ? [1, 1.25] : [1, 1.75]}
      shadows={!lite}
      camera={{ position: [0, 2.4, 3.6], fov: 36 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
      aria-hidden
    >
      <hemisphereLight args={['#FFF6DD', '#27452F', 0.65]} />
      <directionalLight
        position={[2.5, 5, 3]}
        intensity={1.5}
        castShadow={!lite}
        shadow-mapSize={[1024, 1024]}
      />
      <Suspense fallback={null}>
        <Environment resolution={32} frames={1}>
          <Lightformer
            form="rect"
            intensity={1.8}
            color="#FFF4DC"
            position={[0, 4, 3]}
            scale={[6, 3, 1]}
          />
        </Environment>
        <Box items={items} />
        <ContactShadows
          position={[0, -0.56, 0]}
          opacity={0.35}
          scale={6}
          blur={2.4}
          far={2}
          frames={1}
          color="#27452F"
        />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.6}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.4}
      />
    </Canvas>
  );
}
