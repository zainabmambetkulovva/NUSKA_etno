'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';

import { Environment, Lightformer } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { seeded } from './procedural';

import { HORN_PATHS } from '@/components/brand/ornament';

/**
 * Brand-story scene (TZ §5, section 05): a yurt at the foot of the mountains.
 * Everything is procedural; the camera drifts slowly and follows the page
 * scroll (parallax). Rendering stops while the section is off screen.
 */

const damp = THREE.MathUtils.damp;

/** Felt band of the yurt with a row of kochkor muyuz. */
function createBandTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#B4442F';
  ctx.fillRect(0, 0, 1024, 128);
  ctx.fillStyle = '#F4E9B9';
  ctx.fillRect(0, 10, 1024, 6);
  ctx.fillRect(0, 112, 1024, 6);
  ctx.strokeStyle = '#F4E9B9';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  for (let x = 0; x < 1024; x += 128) {
    ctx.save();
    ctx.translate(x + 4, 34);
    HORN_PATHS.forEach((d) => ctx.stroke(new Path2D(d)));
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  return texture;
}

function Yurt() {
  const band = useMemo(createBandTexture, []);
  useEffect(() => () => band.dispose(), [band]);
  return (
    <group position={[0.9, 0, 0.4]} scale={0.82}>
      {/* Walls (kerege) covered with white felt */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.25, 1.3, 1.1, 48]} />
        <meshStandardMaterial color="#F6F0E0" roughness={0.95} />
      </mesh>
      {/* Ornamental band */}
      <mesh position={[0, 0.98, 0]}>
        <cylinderGeometry args={[1.262, 1.268, 0.22, 48, 1, true]} />
        <meshStandardMaterial map={band} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Roof (uuk) */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[1.42, 0.85, 48, 1, true]} />
        <meshStandardMaterial color="#EFE6CF" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      {/* Tunduk */}
      <mesh position={[0, 1.86, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.22, 0.045, 10, 32]} />
        <meshStandardMaterial color="#8A5A33" roughness={0.6} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.42, 1.28]} rotation-x={-0.04}>
        <boxGeometry args={[0.5, 0.84, 0.05]} />
        <meshStandardMaterial color="#B4442F" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.42, 1.31]}>
        <boxGeometry args={[0.56, 0.9, 0.02]} />
        <meshStandardMaterial color="#8A5A33" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Mountains({ lite }: { lite: boolean }) {
  const peaks = useMemo(() => {
    const rand = seeded(7);
    return Array.from({ length: lite ? 7 : 11 }, (_, i) => {
      const far = i % 2 === 0;
      return {
        x: -9 + i * 1.8 + (rand() - 0.5),
        z: far ? -9 - rand() * 2 : -6 - rand() * 1.5,
        h: far ? 4 + rand() * 2.5 : 2.6 + rand() * 1.6,
        r: far ? 2.6 + rand() : 2 + rand() * 0.8,
        far,
      };
    });
  }, [lite]);
  return (
    <group>
      {peaks.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position={[0, p.h / 2, 0]}>
            <coneGeometry args={[p.r, p.h, lite ? 6 : 8]} />
            <meshStandardMaterial color={p.far ? '#6E8A87' : '#4D7A55'} roughness={1} flatShading />
          </mesh>
          {/* Snow cap */}
          <mesh position={[0, p.h * 0.84, 0]}>
            <coneGeometry args={[p.r * 0.33, p.h * 0.33, lite ? 6 : 8]} />
            <meshStandardMaterial color="#FBF6E3" roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Trees({ lite }: { lite: boolean }) {
  const trees = useMemo(() => {
    const rand = seeded(3);
    return Array.from({ length: lite ? 6 : 12 }, () => {
      const side = rand() > 0.5 ? 1 : -1;
      return {
        x: side * (2.6 + rand() * 3.5),
        z: -1.5 - rand() * 3,
        s: 0.6 + rand() * 0.5,
      };
    });
  }, [lite]);
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
            <meshStandardMaterial color="#6B4226" />
          </mesh>
          <mesh position={[0, 1, 0]} castShadow>
            <coneGeometry args={[0.45, 1.4, 7]} />
            <meshStandardMaterial color="#27452F" roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Rig({ reducedMotion }: { reducedMotion: boolean }) {
  useFrame((state, delta) => {
    if (reducedMotion) return;
    // Slow drift + parallax with the page scroll + a little pointer follow.
    const rect = state.gl.domElement.getBoundingClientRect();
    const progress = THREE.MathUtils.clamp(
      1 - (rect.top + rect.height) / (window.innerHeight + rect.height),
      0,
      1
    );
    const t = state.clock.elapsedTime;
    const x = Math.sin(t * 0.08) * 1.2 + state.pointer.x * 0.6;
    const y = 3.2 - progress * 0.9;
    const z = 10.4 - progress * 1.8;
    state.camera.position.x = damp(state.camera.position.x, x, 1.5, delta);
    state.camera.position.y = damp(state.camera.position.y, y, 1.5, delta);
    state.camera.position.z = damp(state.camera.position.z, z, 1.5, delta);
    state.camera.lookAt(0, 1.3, -1.5);
  });
  return null;
}

/** Leaves carried by the wind (decorative, light). */
function Leaves({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const rand = seeded(19);
    return Array.from({ length: count }, () => ({
      x: (rand() - 0.5) * 12,
      y: rand() * 4,
      z: (rand() - 0.5) * 6,
      speed: 0.2 + rand() * 0.4,
      phase: rand() * Math.PI * 2,
    }));
  }, [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    data.forEach((leaf, i) => {
      const x = ((leaf.x + t * leaf.speed + 6) % 12) - 6;
      dummy.position.set(x, leaf.y + Math.sin(t + leaf.phase) * 0.3, leaf.z);
      dummy.rotation.set(t * leaf.speed * 2, leaf.phase, t * leaf.speed);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.12, 0.07]} />
      <meshStandardMaterial color="#C7A76C" side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

export default function YurtScene({
  lite,
  reducedMotion,
  active,
}: {
  lite: boolean;
  reducedMotion: boolean;
  active: boolean;
}) {
  return (
    <Canvas
      frameloop={!active ? 'never' : reducedMotion ? 'demand' : 'always'}
      dpr={lite ? [1, 1.25] : [1, 1.6]}
      shadows={!lite}
      camera={{ position: [0, 3.2, 10.4], fov: 38, near: 0.1, far: 60 }}
      gl={{ antialias: !lite, alpha: true, powerPreference: lite ? 'low-power' : 'default' }}
      onCreated={({ gl, camera }) => {
        camera.lookAt(0, 1.3, -1.5);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
      aria-hidden
    >
      <fog attach="fog" args={['#F4E9B9', 13, 26]} />
      <hemisphereLight args={['#FFF6DD', '#355B3E', 0.75]} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.5}
        color="#FFE9C2"
        castShadow={!lite}
        shadow-mapSize={[1024, 1024]}
      />
      <Suspense fallback={null}>
        <Environment resolution={32} frames={1}>
          <Lightformer
            form="rect"
            intensity={1.6}
            color="#FFF4DC"
            position={[0, 5, 4]}
            scale={[8, 3, 1]}
          />
        </Environment>
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[14, 48]} />
          <meshStandardMaterial color="#9DAA6F" roughness={1} />
        </mesh>
        <Mountains lite={lite} />
        <Trees lite={lite} />
        <Yurt />
        {!reducedMotion && <Leaves count={lite ? 14 : 30} />}
      </Suspense>
      <Rig reducedMotion={reducedMotion} />
    </Canvas>
  );
}
