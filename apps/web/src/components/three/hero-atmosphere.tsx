'use client';

import { useEffect, useMemo, useRef } from 'react';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { MotionValue } from 'framer-motion';
import * as THREE from 'three';

/**
 * WebGL atmosphere over the hero picture (desktop only, loaded lazily):
 * drifting volumetric clouds, golden pollen in the sunlight and soft light
 * shafts. The camera follows the mouse a little (depth) and moves toward the
 * products as the page scrolls. Everything is drawn in code — no downloads.
 * Textures and geometries are disposed when the scene unmounts.
 */

interface Props {
  /** -1..1 pointer position over the hero. */
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  /** 0..1 scroll progress through the hero. */
  progress: MotionValue<number>;
  /** false while the hero is off screen: the render loop stops. */
  active: boolean;
}

/** Soft cloud texture: overlapping blurred discs on a transparent canvas. */
function cloudTexture(seed: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 14; i++) {
    const x = 50 + rnd() * 156;
    const y = 50 + rnd() * 40;
    const r = 26 + rnd() * 34;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.6, 'rgba(255,250,240,0.25)');
    g.addColorStop(1, 'rgba(255,250,240,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function Clouds() {
  const group = useRef<THREE.Group>(null);
  const clouds = useMemo(
    () =>
      [
        { x: -1.5, y: 3.1, z: -1.5, w: 3.4, speed: 0.08, seed: 7 },
        { x: 2.6, y: 3.4, z: -3, w: 4.2, speed: 0.05, seed: 19 },
        { x: 5.2, y: 2.7, z: -1.2, w: 2.8, speed: 0.1, seed: 31 },
      ].map((cloud) => ({ ...cloud, texture: cloudTexture(cloud.seed) })),
    []
  );
  useEffect(() => () => clouds.forEach((c) => c.texture.dispose()), [clouds]);
  useFrame((state, delta) => {
    group.current?.children.forEach((mesh, i) => {
      const cloud = clouds[i];
      mesh.position.x += cloud.speed * delta;
      if (mesh.position.x > 8) mesh.position.x = -8;
      mesh.position.y = cloud.y + Math.sin(state.clock.elapsedTime * 0.2 + i) * 0.05;
    });
  });
  return (
    <group ref={group}>
      {clouds.map((cloud) => (
        <mesh key={cloud.seed} position={[cloud.x, cloud.y, cloud.z]}>
          <planeGeometry args={[cloud.w, cloud.w / 2.6]} />
          <meshBasicMaterial map={cloud.texture} transparent depthWrite={false} opacity={0.42} />
        </mesh>
      ))}
    </group>
  );
}

const POLLEN_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * (0.15 + aSeed * 0.1);
    p.y = mod(p.y + t, 7.0) - 2.5;
    p.x += sin(uTime * 0.5 + aSeed * 12.0) * 0.25;
    p.z += cos(uTime * 0.4 + aSeed * 9.0) * 0.2;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.0 + aSeed * 4.0) * uPixelRatio / -mv.z;
    vAlpha = 0.25 + 0.35 * (0.5 + 0.5 * sin(uTime * 1.5 + aSeed * 30.0));
  }
`;

const POLLEN_FRAGMENT = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(1.0, 0.86, 0.55, a * vAlpha);
  }
`;

/** Golden pollen rising slowly in the sunlight (one draw call, animated on the GPU). */
function Pollen({ count = 140 }: { count?: number }) {
  const { gl } = useThree();
  const material = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // mostly over the picture on the right, little over the text
      positions[i * 3] = -1 + Math.random() * 8;
      positions[i * 3 + 1] = Math.random() * 7 - 2.5;
      positions[i * 3 + 2] = Math.random() * 4 - 2;
      seeds[i] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    return g;
  }, [count]);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.5) * 14 } }),
    [gl]
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
  });
  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={material}
        vertexShader={POLLEN_VERTEX}
        fragmentShader={POLLEN_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Warm light shafts falling from the upper left, breathing slowly. */
function LightShafts() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, 'rgba(255,236,190,0.55)');
    g.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 256);
    const side = ctx.createLinearGradient(0, 0, 64, 0);
    side.addColorStop(0, 'rgba(0,0,0,1)');
    side.addColorStop(0.5, 'rgba(0,0,0,0)');
    side.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, 64, 256);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const group = useRef<THREE.Group>(null);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame((state) => {
    group.current?.children.forEach((mesh, i) => {
      const material = (mesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.opacity = 0.12 + Math.sin(state.clock.elapsedTime * 0.35 + i * 1.7) * 0.05;
    });
  });
  return (
    <group ref={group} position={[-3.5, 3.4, -2]} rotation={[0, 0, 0.55]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 1.2, -3, 0]}>
          <planeGeometry args={[0.7 + i * 0.25, 8]} />
          <meshBasicMaterial
            map={texture}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            opacity={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Camera: leans toward the mouse and dollies toward the products while scrolling. */
function CameraRig({ pointerX, pointerY, progress }: Omit<Props, 'active'>) {
  const target = useMemo(() => new THREE.Vector3(1.2, 0, 0), []);
  useFrame(({ camera }, delta) => {
    const p = progress.get();
    const k = 1 - Math.exp(-delta * 3);
    camera.position.x += (pointerX.get() * 0.6 + p * 1.2 - camera.position.x) * k;
    camera.position.y += (-pointerY.get() * 0.35 - p * 0.6 - camera.position.y) * k;
    camera.position.z += (8 - p * 2.6 - camera.position.z) * k;
    camera.lookAt(target);
  });
  return null;
}

export default function HeroAtmosphere({ pointerX, pointerY, progress, active }: Props) {
  return (
    <Canvas
      className="!pointer-events-none"
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
      camera={{ position: [0, 0, 8], fov: 42 }}
      aria-hidden
    >
      <CameraRig pointerX={pointerX} pointerY={pointerY} progress={progress} />
      <LightShafts />
      <Clouds />
      <Pollen />
    </Canvas>
  );
}
