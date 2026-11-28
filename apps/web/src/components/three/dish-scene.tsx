'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, type ReactElement } from 'react';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { layerY, type DishLayerKind } from '@/components/recipes/dish-layers';
import {
  AYAK_PROFILE,
  BOWL_PROFILE,
  createDastorkonTexture,
  seeded,
  vessel,
} from '@/components/three/procedural';

/**
 * A dish "taken apart": its parts float one above another and the whole stack
 * turns slowly, like an exploded view. Everything is modelled in code (no
 * downloads). The screen height of every layer is reported to the page so the
 * HTML labels line up with the parts.
 */

function mat(color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, ...extra });
}

/** Shallow serving dish (tabak) with a gold rim. */
function Plate({ radius = 1.35 }: { radius?: number }) {
  const geometry = useMemo(
    () =>
      vessel(
        [
          [0.001, 0],
          [radius * 0.55, 0],
          [radius * 0.62, 0.04],
          [radius * 0.92, 0.1],
          [radius, 0.16],
        ],
        0.035,
        64
      ),
    [radius]
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group position={[0, -0.08, 0]}>
      <mesh geometry={geometry} material={mat('#F7F1E3', { roughness: 0.35 })} />
      <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius - 0.015, 0.018, 8, 80]} />
        <meshStandardMaterial color="#C7A66A" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.86, 0.012, 6, 80]} />
        <meshStandardMaterial color="#355B3E" roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Pieces scattered over a disc: `make` returns a mesh for every piece. */
function Scatter({
  count,
  radius,
  seed,
  make,
}: {
  count: number;
  radius: number;
  seed: number;
  make: (rnd: () => number, i: number) => ReactElement;
}) {
  const pieces = useMemo(() => {
    const rnd = seeded(seed);
    return Array.from({ length: count }, (_, i) => {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * radius;
      return { key: i, x: Math.cos(a) * r, z: Math.sin(a) * r, el: make(rnd, i) };
    });
  }, [count, radius, seed]);
  return (
    <group>
      {pieces.map((p) => (
        <group key={p.key} position={[p.x, 0, p.z]}>
          {p.el}
        </group>
      ))}
    </group>
  );
}

const NOODLE = mat('#EAD7A4', { roughness: 0.55 });
const MEAT = [mat('#8A4B2A', { flatShading: true }), mat('#A0603A', { flatShading: true })];
const ONION = mat('#F4EEDD', { roughness: 0.4, transparent: true, opacity: 0.92 });
const PEPPER = mat('#2B2A22');
const NAVAT = new THREE.MeshPhysicalMaterial({
  color: '#F6E7C4',
  roughness: 0.15,
  transmission: 0.35,
  thickness: 0.4,
  flatShading: true,
});
const ZHUPKA = mat('#D9A55A', { roughness: 0.8 });

function Liquid({
  radius,
  color,
  opacity = 1,
}: {
  radius: number;
  color: string;
  opacity?: number;
}) {
  return (
    <mesh>
      <cylinderGeometry args={[radius, radius * 0.94, 0.05, 48]} />
      <meshStandardMaterial
        color={color}
        roughness={0.15}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

function Bowl({
  profile,
  scale,
  color,
  rim,
}: {
  profile: [number, number][];
  scale: number;
  color: string;
  rim?: string;
}) {
  const geometry = useMemo(() => vessel(profile, 0.025, 48), [profile]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const top = profile[profile.length - 1];
  return (
    <group scale={scale} position={[0, -0.12, 0]}>
      <mesh geometry={geometry} material={mat(color, { roughness: 0.4, side: THREE.DoubleSide })} />
      {rim && (
        <mesh position={[0, top[1] - 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[top[0] - 0.02, 0.012, 6, 48]} />
          <meshStandardMaterial color={rim} roughness={0.4} />
        </mesh>
      )}
    </group>
  );
}

/** Ornamental dastorkon cloth. */
function Cloth() {
  const texture = useMemo(() => createDastorkonTexture(512), []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.45, 64]} />
      <meshStandardMaterial map={texture} roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Kattama: layered flatbread with a spiral of folds. */
function Kattama() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    g.addColorStop(0, '#E9B96B');
    g.addColorStop(1, '#B9772F');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(120,70,25,0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 10; a += 0.05) {
      const r = 6 + a * 3.8;
      ctx.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
    }
    ctx.stroke();
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.04, i * 0.075, -i * 0.03]} rotation={[0, i * 0.6, 0]}>
          <cylinderGeometry args={[0.95 - i * 0.04, 0.97 - i * 0.04, 0.07, 48]} />
          <meshStandardMaterial
            attach="material"
            map={texture}
            color={i === 2 ? '#FFFFFF' : '#E8C48A'}
            roughness={0.75}
          />
        </mesh>
      ))}
    </group>
  );
}

function Layer({ kind }: { kind: DishLayerKind }) {
  switch (kind) {
    case 'plate':
      return <Plate />;
    case 'saucer':
      return <Plate radius={0.9} />;
    case 'noodles':
      return (
        <Scatter
          count={16}
          radius={0.95}
          seed={3}
          make={(rnd) => (
            <mesh
              material={NOODLE}
              rotation={[(rnd() - 0.5) * 0.5, rnd() * Math.PI, (rnd() - 0.5) * 0.5]}
              position={[0, rnd() * 0.08, 0]}
            >
              <boxGeometry args={[0.42, 0.018, 0.42]} />
            </mesh>
          )}
        />
      );
    case 'meat':
      return (
        <Scatter
          count={18}
          radius={0.8}
          seed={11}
          make={(rnd, i) => (
            <mesh
              material={MEAT[i % 2]}
              scale={[0.16 + rnd() * 0.08, 0.08 + rnd() * 0.04, 0.12 + rnd() * 0.06]}
              rotation={[rnd(), rnd() * 3, rnd()]}
              position={[0, rnd() * 0.1, 0]}
            >
              <dodecahedronGeometry args={[1, 0]} />
            </mesh>
          )}
        />
      );
    case 'onion':
      return (
        <group>
          <Scatter
            count={10}
            radius={0.75}
            seed={5}
            make={(rnd) => (
              <mesh
                material={ONION}
                rotation={[Math.PI / 2 + (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.6, 0]}
              >
                <torusGeometry args={[0.1 + rnd() * 0.08, 0.022, 8, 24]} />
              </mesh>
            )}
          />
          <Scatter
            count={14}
            radius={0.8}
            seed={9}
            make={() => (
              <mesh material={PEPPER}>
                <sphereGeometry args={[0.02, 6, 6]} />
              </mesh>
            )}
          />
        </group>
      );
    case 'broth':
      return (
        <group>
          <Bowl profile={BOWL_PROFILE} scale={1.5} color="#FBF6EA" rim="#355B3E" />
          <group position={[0, 0.2, 0]}>
            <Liquid radius={0.42} color="#D9A54A" opacity={0.92} />
          </group>
        </group>
      );
    case 'kattama':
      return <Kattama />;
    case 'butter':
      return (
        <mesh rotation={[0, 0.5, 0]}>
          <boxGeometry args={[0.55, 0.22, 0.4]} />
          <meshStandardMaterial color="#F3C64F" roughness={0.35} />
        </mesh>
      );
    case 'honey':
      return (
        <group>
          <mesh>
            <cylinderGeometry args={[0.72, 0.6, 0.04, 48]} />
            <meshPhysicalMaterial
              color="#D98E1C"
              roughness={0.08}
              transmission={0.25}
              thickness={0.3}
              transparent
              opacity={0.92}
            />
          </mesh>
          <Scatter
            count={6}
            radius={0.55}
            seed={21}
            make={(rnd) => (
              <mesh position={[0, -0.08 - rnd() * 0.12, 0]} scale={[1, 1.6, 1]}>
                <sphereGeometry args={[0.045, 12, 12]} />
                <meshStandardMaterial color="#D98E1C" roughness={0.1} />
              </mesh>
            )}
          />
        </group>
      );
    case 'piala':
      return <Bowl profile={BOWL_PROFILE} scale={2} color="#FBF6EA" rim="#355B3E" />;
    case 'tea':
      return <Liquid radius={0.58} color="#7A3B12" opacity={0.95} />;
    case 'navat':
      return (
        <Scatter
          count={11}
          radius={0.5}
          seed={13}
          make={(rnd) => (
            <mesh
              material={NAVAT}
              scale={0.09 + rnd() * 0.07}
              rotation={[rnd() * 3, rnd() * 3, rnd() * 3]}
              position={[0, rnd() * 0.15, 0]}
            >
              <octahedronGeometry args={[1, 0]} />
            </mesh>
          )}
        />
      );
    case 'zhupka':
      return (
        <Scatter
          count={8}
          radius={0.7}
          seed={17}
          make={(rnd) => (
            <mesh material={ZHUPKA} rotation={[rnd(), rnd() * 3, rnd()]} scale={[0.16, 0.07, 0.1]}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
          )}
        />
      );
    case 'cloth':
      return <Cloth />;
    case 'ayak':
      return <Bowl profile={AYAK_PROFILE} scale={1.7} color="#8A5A33" rim="#C7A66A" />;
    case 'kymyz':
      return (
        <group>
          <Liquid radius={0.82} color="#F3EEE2" />
          <Scatter
            count={12}
            radius={0.7}
            seed={23}
            make={(rnd) => (
              <mesh position={[0, 0.03, 0]}>
                <sphereGeometry args={[0.02 + rnd() * 0.03, 8, 8]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.1} transparent opacity={0.8} />
              </mesh>
            )}
          />
        </group>
      );
  }
}

/** Turns the stack; every part bobs a little on its own. */
function Stack({ layers, spin }: { layers: DishLayerKind[]; spin: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    if (spin) group.current.rotation.y += delta * 0.28;
    const t = state.clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      child.position.y =
        layerY(i, layers.length) + (spin ? Math.sin(t * 0.9 + i * 1.3) * 0.035 : 0);
    });
  });
  return (
    <group ref={group} rotation={[0, 0.4, 0]}>
      {layers.map((kind, i) => (
        <group key={`${kind}-${i}`} position={[0, layerY(i, layers.length), 0]}>
          <Layer kind={kind} />
        </group>
      ))}
    </group>
  );
}

/** Reports where each layer is on the screen (0..1 from the top). */
function Measure({ count, onLayout }: { count: number; onLayout: (tops: number[]) => void }) {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const v = new THREE.Vector3();
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    onLayout(
      Array.from({ length: count }, (_, i) => {
        v.set(0, layerY(i, count), 0).project(camera);
        return (1 - v.y) / 2;
      })
    );
  }, [camera, size, count, onLayout]);
  return null;
}

export default function DishScene({
  layers,
  active,
  still,
  onLayout,
}: {
  layers: DishLayerKind[];
  /** false while off screen: nothing is drawn. */
  active: boolean;
  /** reduced motion: a still picture. */
  still: boolean;
  onLayout: (tops: number[]) => void;
}) {
  return (
    <Canvas
      frameloop={active && !still ? 'always' : 'demand'}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 2.1, 6.6], fov: 34 }}
    >
      <hemisphereLight args={['#FFF6E0', '#2A4831', 0.9]} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} color="#FFE7B8" />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#C7A66A" />
      <Stack layers={layers} spin={!still} />
      <Measure count={layers.length} onLayout={onLayout} />
    </Canvas>
  );
}
