'use client';

import { useEffect, useMemo, useRef } from 'react';

import { Environment, Float, Lightformer } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { HORN_PATHS } from '@/components/brand/ornament';

/** Ring texture: a row of kochkor muyuz in soft gold on transparent. */
function ringTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  ctx.strokeStyle = '#E2CFA4';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  for (let x = 4; x < 1024; x += 128) {
    ctx.save();
    ctx.translate(x, 18);
    HORN_PATHS.forEach((d) => ctx.stroke(new Path2D(d)));
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function Symbol({ reducedMotion }: { reducedMotion: boolean }) {
  const ring = useRef<THREE.Group>(null);
  const texture = useMemo(ringTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const sparks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return [Math.cos(a) * 1.75, Math.sin(a * 3) * 0.35, Math.sin(a) * 1.75] as [
          number,
          number,
          number,
        ];
      }),
    []
  );
  useFrame((_, delta) => {
    if (!reducedMotion && ring.current) ring.current.rotation.y += delta * 0.35;
  });
  return (
    <Float speed={reducedMotion ? 0 : 1.6} rotationIntensity={0.25} floatIntensity={0.6}>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial
          color="#355B3E"
          roughness={0.25}
          clearcoat={1}
          clearcoatRoughness={0.15}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.36, 32, 32]} />
        <meshStandardMaterial color="#F4E9B9" emissive="#F4E9B9" emissiveIntensity={0.5} />
      </mesh>
      <group ref={ring} rotation-x={0.35}>
        <mesh>
          <cylinderGeometry args={[1.38, 1.38, 0.16, 96, 1, true]} />
          <meshStandardMaterial
            map={texture}
            transparent
            side={THREE.DoubleSide}
            emissive="#C7A76C"
            emissiveMap={texture}
            emissiveIntensity={0.9}
          />
        </mesh>
        {sparks.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color="#C7A76C" emissive="#C7A76C" emissiveIntensity={0.8} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

export default function AiOrbScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <Canvas
      frameloop={reducedMotion ? 'demand' : 'always'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.4, 4.4], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
      aria-hidden
    >
      <hemisphereLight args={['#FFF6DD', '#27452F', 0.8]} />
      <directionalLight position={[2, 3, 4]} intensity={1.4} />
      <Environment resolution={32} frames={1}>
        <Lightformer form="ring" intensity={2} color="#FFF4DC" position={[0, 2, 3]} scale={3} />
      </Environment>
      <Symbol reducedMotion={reducedMotion} />
    </Canvas>
  );
}
