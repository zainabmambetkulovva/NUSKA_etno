'use client';

import { useEffect, useMemo, useRef } from 'react';

import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { HORN_PATHS } from '@/components/brand/horn-paths';
import { seeded, vessel } from '@/components/three/procedural';

/**
 * Hero composition: a carved wooden podium with Kyrgyz ornaments carrying a
 * glass jar of honey, navat in a carved bowl, kymyz in a ceramic bowl, zhupka,
 * kurut and sary may. The whole composition is one THREE.Group that turns
 * slowly and endlessly to the left (negative rotation.y, ~30 s per turn,
 * delta-time based, so there is no jump when a turn completes).
 * Leaves float independently and golden sun particles drift around it.
 */

const TURN_SECONDS = 30;
const rand = seeded(11);

// ---------------------------------------------------------------- textures

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function woodGrain(ctx: CanvasRenderingContext2D, w: number, h: number, base: string) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) {
    ctx.strokeStyle = `rgba(${50 + rand() * 30},${25 + rand() * 15},8,${0.06 + rand() * 0.12})`;
    ctx.lineWidth = 1 + rand() * 3;
    ctx.beginPath();
    const y = rand() * h;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w / 3, y + rand() * 16 - 8, (2 * w) / 3, y + rand() * 16 - 8, w, y);
    ctx.stroke();
  }
}

function hornsPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.translate(-60, -30);
  HORN_PATHS.forEach((d) => ctx.stroke(new Path2D(d)));
  ctx.restore();
}

/** Side of the podium: wood with a carved band of ram's horns. */
function podiumSideTexture() {
  return canvasTexture(2048, 256, (ctx) => {
    woodGrain(ctx, 2048, 256, '#7A4A25');
    ctx.lineCap = 'round';
    for (const [color, offset] of [
      ['rgba(30,14,4,0.55)', 2],
      ['rgba(236,190,120,0.35)', 0],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 7;
      for (let x = 64; x < 2048; x += 128) hornsPath(ctx, x + offset, 128 + offset, 1.1);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 30 + offset);
      ctx.lineTo(2048, 30 + offset);
      ctx.moveTo(0, 226 + offset);
      ctx.lineTo(2048, 226 + offset);
      ctx.stroke();
    }
  });
}

/** Top of the podium: polished wood with a carved ring of ornaments. */
function podiumTopTexture() {
  return canvasTexture(1024, 1024, (ctx) => {
    const C = 512;
    const g = ctx.createRadialGradient(C, C, 40, C, C, 520);
    g.addColorStop(0, '#B07A45');
    g.addColorStop(1, '#8A5730');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 1024);
    for (let r = 20; r < 512; r += 9 + rand() * 10) {
      ctx.strokeStyle = `rgba(60,30,10,${0.05 + rand() * 0.08})`;
      ctx.lineWidth = 1 + rand() * 2;
      ctx.beginPath();
      ctx.arc(C, C, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.lineCap = 'round';
    for (const [color, offset] of [
      ['rgba(35,16,5,0.5)', 2],
      ['rgba(240,200,130,0.35)', 0],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(C + offset, C + offset, 490, 0, Math.PI * 2);
      ctx.arc(C + offset, C + offset, 400, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 6;
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        ctx.save();
        ctx.translate(C + Math.cos(a) * 445 + offset, C + Math.sin(a) * 445 + offset);
        ctx.rotate(a + Math.PI / 2);
        hornsPath(ctx, 0, 0, 0.62);
        ctx.restore();
      }
    }
  });
}

/** Glaze band of the kymyz bowl and the label of the honey jar. */
function ornamentBand(bg: string, fg: string) {
  return canvasTexture(1024, 128, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 128);
    ctx.strokeStyle = fg;
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;
    for (let x = 64; x < 1024; x += 128) hornsPath(ctx, x, 66, 0.8);
  });
}

function honeyTag() {
  return canvasTexture(256, 320, (ctx) => {
    ctx.fillStyle = '#F4E6C8';
    ctx.fillRect(0, 0, 256, 320);
    ctx.strokeStyle = '#B07A35';
    ctx.lineWidth = 6;
    ctx.strokeRect(14, 14, 228, 292);
    ctx.lineWidth = 9;
    ctx.lineJoin = 'round';
    ctx.translate(128, 150);
    for (const [x, y] of [
      [0, -42],
      [42, 0],
      [0, 42],
      [-42, 0],
    ]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-20, -20, 40, 40);
      ctx.restore();
    }
    ctx.fillStyle = '#7A4A25';
    ctx.font = '600 34px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('NUSKA', 0, 118);
  });
}

// --------------------------------------------------------------- materials

const mat = {
  wood: (map: THREE.Texture) => new THREE.MeshStandardMaterial({ map, roughness: 0.55 }),
  gold: () => new THREE.MeshStandardMaterial({ color: '#D6AD62', metalness: 0.9, roughness: 0.25 }),
  glass: () =>
    new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      roughness: 0.04,
      transparent: true,
      opacity: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      ior: 1.5,
      specularIntensity: 1,
      depthWrite: false,
    }),
};

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material | THREE.Material[]) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

const lathe = (points: [number, number][], segments = 64) =>
  new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    segments
  );

// ---------------------------------------------------------------- products

function honeyJar() {
  const g = new THREE.Group();
  const honey = new THREE.MeshPhysicalMaterial({
    color: '#E39A23',
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    emissive: '#7A3A00',
    emissiveIntensity: 0.18,
    sheen: 0.4,
    sheenColor: new THREE.Color('#FFD27A'),
  });
  g.add(
    mesh(
      lathe([
        [0, 0.03],
        [0.5, 0.03],
        [0.55, 0.1],
        [0.55, 0.9],
        [0.47, 0.98],
        [0, 0.98],
      ]),
      honey
    )
  );
  const glass = mesh(
    lathe([
      [0, 0],
      [0.54, 0],
      [0.59, 0.08],
      [0.59, 0.96],
      [0.5, 1.06],
      [0.44, 1.1],
      [0.44, 1.18],
      [0, 1.18],
    ]),
    mat.glass()
  );
  glass.castShadow = false;
  g.add(glass);
  // burlap cover with twine
  const cloth = mesh(
    new THREE.CylinderGeometry(0.46, 0.62, 0.24, 40, 1),
    new THREE.MeshStandardMaterial({ color: '#C9A877', roughness: 1 })
  );
  cloth.position.y = 1.22;
  g.add(cloth);
  const twine = mesh(
    new THREE.TorusGeometry(0.47, 0.025, 8, 48),
    new THREE.MeshStandardMaterial({ color: '#8C6A3F', roughness: 1 })
  );
  twine.rotation.x = Math.PI / 2;
  twine.position.y = 1.16;
  g.add(twine);
  const tag = mesh(
    new THREE.PlaneGeometry(0.22, 0.28),
    new THREE.MeshStandardMaterial({ map: honeyTag(), roughness: 0.8, side: THREE.DoubleSide })
  );
  tag.position.set(0.22, 0.95, 0.57);
  tag.rotation.set(0, 0.35, 0.12);
  g.add(tag);
  // honey dipper leaning on the jar
  const dipper = new THREE.Group();
  const woodLight = new THREE.MeshStandardMaterial({ color: '#C08A4E', roughness: 0.6 });
  const stick = mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.3, 12), woodLight);
  stick.position.y = 0.65;
  dipper.add(stick);
  for (let i = 0; i < 4; i++) {
    const ring = mesh(
      new THREE.CylinderGeometry(0.11 - i * 0.012, 0.11 - i * 0.012, 0.05, 20),
      honey
    );
    ring.position.y = 0.06 + i * 0.07;
    dipper.add(ring);
  }
  dipper.position.set(-0.15, 1.2, 0.05);
  dipper.rotation.set(0.15, 0, 0.75);
  g.add(dipper);
  return g;
}

function carvedBowl(radius: number, height: number, band: THREE.Texture, wood: THREE.Texture) {
  const g = new THREE.Group();
  const profile: [number, number][] = [
    [0.001, 0],
    [radius * 0.55, 0],
    [radius * 0.6, height * 0.08],
    [radius * 0.9, height * 0.45],
    [radius, height],
  ];
  g.add(mesh(vessel(profile, 0.05, 56), mat.wood(wood)));
  const ring = mesh(
    new THREE.CylinderGeometry(radius * 0.985, radius * 0.88, height * 0.38, 56, 1, true),
    new THREE.MeshStandardMaterial({ map: band, roughness: 0.6, transparent: true })
  );
  ring.position.y = height * 0.7;
  g.add(ring);
  return g;
}

function navatBowl(wood: THREE.Texture, band: THREE.Texture, lite: boolean) {
  const g = carvedBowl(0.82, 0.48, band, wood);
  // navat: faceted amber sugar crystals that catch the light
  const crystal = new THREE.MeshPhysicalMaterial({
    color: '#F2B654',
    roughness: 0.05,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    transparent: true,
    opacity: 0.92,
    emissive: '#8A4A00',
    emissiveIntensity: 0.28,
    specularIntensity: 1,
    flatShading: true,
  });
  const count = lite ? 22 : 46;
  for (let i = 0; i < count; i++) {
    const r = 0.1 + rand() * 0.1;
    const c = mesh(new THREE.IcosahedronGeometry(r * 1.1, 0), crystal);
    const a = rand() * Math.PI * 2;
    const d = rand() * 0.55;
    c.position.set(Math.cos(a) * d, 0.42 + rand() * 0.22 - d * 0.3, Math.sin(a) * d);
    c.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    c.scale.set(1, 1.2 + rand() * 0.5, 1);
    g.add(c);
  }
  for (let i = 0; i < 4; i++) {
    const c = mesh(new THREE.OctahedronGeometry(0.1 + rand() * 0.05, 0), crystal);
    c.position.set(0.9 + rand() * 0.3, 0.08, -0.3 + rand() * 0.6);
    c.rotation.set(rand() * 3, rand() * 3, 0);
    g.add(c);
  }
  return g;
}

function kymyzBowl() {
  const g = new THREE.Group();
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: '#F2E8D2',
    roughness: 0.25,
    clearcoat: 0.9,
  });
  g.add(
    mesh(
      vessel(
        [
          [0.001, 0],
          [0.35, 0],
          [0.4, 0.06],
          [0.7, 0.32],
          [0.82, 0.58],
          [0.84, 0.66],
        ],
        0.045,
        56
      ),
      ceramic
    )
  );
  const band = mesh(
    new THREE.CylinderGeometry(0.835, 0.77, 0.16, 56, 1, true),
    new THREE.MeshStandardMaterial({ map: ornamentBand('#F2E8D2', '#2D5A32'), roughness: 0.3 })
  );
  band.position.y = 0.52;
  g.add(band);
  const milk = mesh(
    new THREE.CircleGeometry(0.76, 48),
    new THREE.MeshPhysicalMaterial({ color: '#FBF8F0', roughness: 0.18, clearcoat: 1 })
  );
  milk.rotation.x = -Math.PI / 2;
  milk.position.y = 0.6;
  g.add(milk);
  return g;
}

function zhupkaStack(wood: THREE.Texture) {
  const g = new THREE.Group();
  g.add(
    mesh(
      lathe([
        [0, 0],
        [0.82, 0],
        [0.95, 0.1],
        [0.88, 0.1],
        [0.78, 0.04],
        [0, 0.04],
      ]),
      mat.wood(wood)
    )
  );
  const top = canvasTexture(512, 512, (ctx) => {
    const gr = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
    gr.addColorStop(0, '#F3D597');
    gr.addColorStop(1, '#D9A25A');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 180; i++) {
      ctx.fillStyle = `rgba(${120 + rand() * 40},${60 + rand() * 30},20,${0.2 + rand() * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(
        rand() * 512,
        rand() * 512,
        2 + rand() * 8,
        2 + rand() * 5,
        rand() * 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  });
  const side = new THREE.MeshStandardMaterial({ color: '#D9A257', roughness: 0.8 });
  const face = new THREE.MeshStandardMaterial({ map: top, roughness: 0.8 });
  for (let i = 0; i < 10; i++) {
    const d = mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.035, 48), [side, face, face]);
    d.position.set((rand() - 0.5) * 0.05, 0.07 + i * 0.04, (rand() - 0.5) * 0.05);
    d.rotation.set((rand() - 0.5) * 0.04, rand() * 3, (rand() - 0.5) * 0.04);
    g.add(d);
  }
  return g;
}

function kurutBowl(wood: THREE.Texture, band: THREE.Texture) {
  const g = carvedBowl(0.6, 0.36, band, wood);
  const kurut = new THREE.MeshStandardMaterial({ color: '#FAF6EC', roughness: 0.95 });
  const spots: [number, number, number][] = [
    [0, 0.36, 0],
    [0.24, 0.33, 0.08],
    [-0.24, 0.33, 0.05],
    [0.08, 0.32, 0.26],
    [-0.1, 0.32, -0.24],
    [0.16, 0.56, 0.05],
    [-0.12, 0.56, 0.1],
  ];
  for (const [x, y, z] of spots) {
    const k = mesh(new THREE.IcosahedronGeometry(0.15, 3), kurut);
    k.position.set(x, y, z);
    k.scale.set(1, 0.9 + rand() * 0.15, 1);
    g.add(k);
  }
  return g;
}

function butterBoard(wood: THREE.Texture) {
  const g = new THREE.Group();
  const board = mesh(new THREE.BoxGeometry(1.1, 0.08, 0.7), mat.wood(wood));
  board.position.y = 0.04;
  g.add(board);
  const butter = new THREE.MeshPhysicalMaterial({
    color: '#F8DB78',
    roughness: 0.35,
    clearcoat: 0.4,
  });
  const block = mesh(new THREE.BoxGeometry(0.62, 0.34, 0.42), butter);
  block.position.set(-0.08, 0.25, 0);
  g.add(block);
  const piece = mesh(new THREE.BoxGeometry(0.22, 0.2, 0.22), butter);
  piece.position.set(0.38, 0.18, 0.12);
  piece.rotation.y = 0.5;
  g.add(piece);
  return g;
}

function leafGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.12, 0.1, 0.2, 0.32, 0, 0.5);
  shape.bezierCurveTo(-0.2, 0.32, -0.12, 0.1, 0, 0);
  return new THREE.ShapeGeometry(shape, 12);
}

function buildComposition(lite: boolean) {
  const root = new THREE.Group();
  const wood = canvasTexture(512, 512, (ctx) => woodGrain(ctx, 512, 512, '#8A5A33'));
  const band = ornamentBand('#6E4222', '#E2B878');

  // podium: two carved tiers and a gold ring
  const sideMat = mat.wood(podiumSideTexture());
  const topMat = mat.wood(podiumTopTexture());
  const plain = mat.wood(wood);
  const tier = mesh(new THREE.CylinderGeometry(3.05, 3.15, 0.42, 96), [sideMat, topMat, plain]);
  tier.position.y = -0.21;
  root.add(tier);
  const base = mesh(new THREE.CylinderGeometry(3.35, 3.45, 0.22, 96), [plain, plain, plain]);
  base.position.y = -0.53;
  root.add(base);
  const ring = mesh(new THREE.TorusGeometry(3.08, 0.035, 12, 128), mat.gold());
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0;
  root.add(ring);

  const place = (o: THREE.Object3D, x: number, z: number, s = 1, ry = 0) => {
    o.position.set(x, 0, z);
    o.scale.setScalar(s);
    o.rotation.y = ry;
    root.add(o);
  };
  place(honeyJar(), 0.2, 0.9, 1.15, -0.3);
  place(navatBowl(wood, band, lite), -1.55, 0.25, 1.05, 0.4);
  place(kymyzBowl(), 1.55, 0.05, 1.05);
  place(zhupkaStack(wood), -0.9, -1.55, 1.0);
  place(kurutBowl(wood, band), 1.25, -1.45, 1.05);
  place(butterBoard(wood), 0.25, -0.9, 0.85, 0.3);
  root.rotation.y = -0.4;

  // a few leaves lying on the podium
  const leafMat = new THREE.MeshStandardMaterial({
    color: '#4F7D3A',
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const leaf = leafGeometry();
  for (const [x, z, r] of [
    [2.2, 1.2, 0.4],
    [-1.0, 1.9, 2.1],
    [0.4, -0.5, 4.0],
  ]) {
    const l = mesh(leaf, leafMat);
    l.rotation.set(-Math.PI / 2, 0, r);
    l.position.set(x, 0.01, z);
    root.add(l);
  }
  return root;
}

// ------------------------------------------------------------------ scene

function Composition({ lite, still }: { lite: boolean; still: boolean }) {
  const group = useMemo(() => buildComposition(lite), [lite]);
  useEffect(
    () => () => {
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
            (m as THREE.MeshStandardMaterial).map?.dispose();
            m.dispose();
          });
        }
      });
    },
    [group]
  );
  useFrame((_, delta) => {
    if (still) return;
    // counter-clockwise for the viewer: always negative, frame-rate independent
    group.rotation.y -= (Math.min(delta, 0.1) * Math.PI * 2) / TURN_SECONDS;
  });
  return <primitive object={group} />;
}

function FloatingLeaves({ count, still }: { count: number; still: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const leaves = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (rand() - 0.5) * 8,
        y: 0.6 + rand() * 3,
        z: (rand() - 0.5) * 4,
        speed: 0.3 + rand() * 0.5,
        phase: rand() * Math.PI * 2,
        scale: 0.5 + rand() * 0.5,
      })),
    [count]
  );
  const geometry = useMemo(() => leafGeometry(), []);
  useFrame(({ clock }) => {
    if (still || !ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.children.forEach((child, i) => {
      const l = leaves[i];
      child.position.y = l.y + Math.sin(t * l.speed + l.phase) * 0.25;
      child.position.x = l.x + Math.sin(t * l.speed * 0.6 + l.phase) * 0.15;
      child.rotation.z = Math.sin(t * l.speed + l.phase) * 0.6;
      child.rotation.x = 0.6 + Math.cos(t * l.speed * 0.8 + l.phase) * 0.4;
    });
  });
  return (
    <group ref={ref}>
      {leaves.map((l, i) => (
        <mesh key={i} geometry={geometry} position={[l.x, l.y, l.z]} scale={l.scale}>
          <meshStandardMaterial
            color={i % 2 ? '#6E9A4A' : '#3F6E34'}
            side={THREE.DoubleSide}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

function SunParticles({ count, still }: { count: number; still: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p: number[] = [];
    for (let i = 0; i < count; i++) p.push((rand() - 0.5) * 10, rand() * 5, (rand() - 0.5) * 6);
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    return g;
  }, [count]);
  useFrame(({ clock }) => {
    if (still || !ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * 0.02;
    ref.current.position.y = Math.sin(t * 0.3) * 0.15;
  });
  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#F6D48C" size={0.045} transparent opacity={0.75} depthWrite={false} />
    </points>
  );
}

export default function HeroPodiumScene({
  lite = false,
  still = false,
  active = true,
}: {
  lite?: boolean;
  still?: boolean;
  /** Render only while the hero is on screen and the tab is visible. */
  active?: boolean;
}) {
  return (
    <Canvas
      shadows={!lite}
      dpr={lite ? [1, 1.5] : [1, 1.75]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 5.6, 10.6], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl, camera }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        camera.lookAt(0, 0.2, 0);
      }}
    >
      <hemisphereLight args={['#FFF1D6', '#2A3A22', 0.9]} />
      <directionalLight
        position={[-4, 7, 5]}
        intensity={2.4}
        color="#FFE3B5"
        castShadow={!lite}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0004}
      />
      <pointLight position={[3.5, 2.5, 4]} intensity={18} distance={14} color="#FFB45C" />
      <Composition lite={lite} still={still} />
      <FloatingLeaves count={lite ? 4 : 8} still={still} />
      <SunParticles count={lite ? 60 : 140} still={still} />
      <ContactShadows position={[0, -0.64, 0]} scale={9} blur={2.6} opacity={0.55} far={2} />
      {/* soft studio reflections for the glass and the honey (no HDR download) */}
      <Environment resolution={lite ? 64 : 128}>
        <Lightformer intensity={2.2} position={[0, 4, 3]} scale={[6, 2, 1]} color="#FFF3DA" />
        <Lightformer
          intensity={1.4}
          position={[-5, 1.5, 1]}
          rotation-y={Math.PI / 2}
          scale={[4, 2, 1]}
          color="#FFD9A0"
        />
        <Lightformer
          intensity={0.8}
          position={[5, 1, -2]}
          rotation-y={-Math.PI / 2}
          scale={[4, 2, 1]}
          color="#B6E0A0"
        />
      </Environment>
    </Canvas>
  );
}
