'use client';

import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { ContactShadows, Environment, Html, Lightformer } from '@react-three/drei';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

import {
  AYAK_PROFILE,
  BOWL_PROFILE,
  createDastorkonTexture,
  JAR_PROFILE,
  seeded,
  TEAPOT_PROFILE,
  vessel,
} from './procedural';

export interface SceneOptions {
  /** Lighter version for phones: fewer segments, no transmission, no shadow maps. */
  lite: boolean;
  /** prefers-reduced-motion: static composition, rendered on demand only. */
  reducedMotion: boolean;
  /** Pause rendering while the hero is off screen or the tab is hidden (TZ §7.7). */
  active: boolean;
  locale: string;
  onError?: () => void;
}

const damp = THREE.MathUtils.damp;
/** Resting camera position: the whole dastorkon fits a square canvas with a margin. */
const CAMERA: [number, number, number] = [0, 8.2, 10.4];

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

function useMaterials(lite: boolean) {
  return useMemo(() => {
    const physical = (
      params: THREE.MeshPhysicalMaterialParameters,
      fallback: THREE.MeshStandardMaterialParameters
    ) => (lite ? new THREE.MeshStandardMaterial(fallback) : new THREE.MeshPhysicalMaterial(params));
    return {
      cloth: new THREE.MeshStandardMaterial({ color: '#355B3E', roughness: 0.95 }),
      wood: new THREE.MeshStandardMaterial({ color: '#8A5A33', roughness: 0.55 }),
      woodDark: new THREE.MeshStandardMaterial({ color: '#6B4226', roughness: 0.6 }),
      ceramic: new THREE.MeshPhysicalMaterial({
        color: '#F8F3E7',
        roughness: 0.3,
        clearcoat: lite ? 0 : 0.6,
      }),
      rim: new THREE.MeshStandardMaterial({ color: '#355B3E', roughness: 0.4 }),
      kymyz: new THREE.MeshStandardMaterial({ color: '#F3EFE4', roughness: 0.15 }),
      butter: new THREE.MeshStandardMaterial({ color: '#F1C84B', roughness: 0.45 }),
      bread: new THREE.MeshStandardMaterial({ color: '#D9A15B', roughness: 0.85 }),
      breadDark: new THREE.MeshStandardMaterial({ color: '#B97A3A', roughness: 0.9 }),
      lid: new THREE.MeshStandardMaterial({ color: '#C9A15B', roughness: 0.4, metalness: 0.3 }),
      glass: physical(
        {
          color: '#ffffff',
          transmission: 1,
          roughness: 0.05,
          thickness: 0.05,
          ior: 1.5,
          transparent: true,
        },
        { color: '#ffffff', transparent: true, opacity: 0.22, roughness: 0.05 }
      ),
      honey: physical(
        { color: '#E39B2D', transmission: 0.55, roughness: 0.12, thickness: 0.6, ior: 1.45 },
        { color: '#E39B2D', roughness: 0.15 }
      ),
      navat: physical(
        { color: '#FFF4D6', transmission: 0.6, roughness: 0.25, thickness: 0.3, ior: 1.55 },
        { color: '#FFF1CC', roughness: 0.25, transparent: true, opacity: 0.92 }
      ),
    };
  }, [lite]);
}

type Materials = ReturnType<typeof useMaterials>;

// ---------------------------------------------------------------------------
// Interactive item: appears with a delay, breathes, lifts on hover, opens the catalog on click
// ---------------------------------------------------------------------------

function Item({
  label,
  position,
  delay,
  reducedMotion,
  onSelect,
  children,
}: {
  label?: string;
  position: [number, number, number];
  delay: number;
  reducedMotion: boolean;
  onSelect?: () => void;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const born = useRef<number | null>(null);
  const interactive = Boolean(label && onSelect);

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    if (reducedMotion) {
      g.scale.setScalar(1);
      return;
    }
    born.current ??= state.clock.elapsedTime;
    const age = state.clock.elapsedTime - born.current - delay;
    const appear = age <= 0 ? 0 : 1 - Math.pow(1 - Math.min(age / 0.8, 1), 3);
    const hover = hovered ? 1 : 0;
    g.scale.setScalar(damp(g.scale.x, appear * (1 + hover * 0.08), 10, delta));
    const breathe = Math.sin(state.clock.elapsedTime * 1.2 + delay * 5) * 0.012;
    g.position.y = damp(g.position.y, hover * 0.18 + breathe, 8, delta);
  });

  // The animated inner group starts collapsed; props are not used for it so re-renders don't reset it.
  useLayoutEffect(() => {
    if (!reducedMotion) ref.current?.scale.setScalar(0);
  }, [reducedMotion]);

  useEffect(() => {
    if (!interactive) return;
    document.body.style.cursor = hovered ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered, interactive]);

  const events = interactive
    ? {
        onPointerOver: (e: ThreeEvent<PointerEvent>) => (e.stopPropagation(), setHovered(true)),
        onPointerOut: () => setHovered(false),
        onClick: (e: ThreeEvent<MouseEvent>) => (e.stopPropagation(), onSelect?.()),
      }
    : {};

  return (
    <group position={position}>
      <group ref={ref} {...events}>
        {children}
        {label && hovered && (
          <Html
            position={[0, 0.95, 0]}
            center
            zIndexRange={[20, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <span className="whitespace-nowrap rounded-md bg-brand px-3 py-1 font-serif text-sm font-semibold text-cream-light shadow-card">
              {label}
            </span>
          </Html>
        )}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Objects
// ---------------------------------------------------------------------------

function Dastorkon({ m, lite }: { m: Materials; lite: boolean }) {
  const texture = useMemo(() => createDastorkonTexture(lite ? 512 : 1024), [lite]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group>
      <mesh material={m.cloth} receiveShadow position={[0, -0.04, 0]}>
        <cylinderGeometry args={[3.25, 3.3, 0.08, lite ? 48 : 96]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]} receiveShadow>
        <circleGeometry args={[3.08, lite ? 48 : 96]} />
        <meshStandardMaterial map={texture} roughness={0.92} />
      </mesh>
    </group>
  );
}

function Piyala({ m, seg }: { m: Materials; seg: number }) {
  const geometry = useMemo(() => vessel(BOWL_PROFILE, 0.02, seg), [seg]);
  return (
    <group>
      <mesh geometry={geometry} material={m.ceramic} castShadow />
      <mesh material={m.rim} position={[0, 0.255, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.322, 0.012, 8, seg]} />
      </mesh>
    </group>
  );
}

function KymyzBowl({ m, seg }: { m: Materials; seg: number }) {
  const geometry = useMemo(() => vessel(AYAK_PROFILE, 0.035, seg), [seg]);
  return (
    <group>
      <mesh geometry={geometry} material={m.wood} castShadow />
      <mesh material={m.kymyz} position={[0, 0.3, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.49, seg]} />
      </mesh>
      {/* Wooden ladle (chomuch) */}
      <group position={[0.18, 0.34, 0.05]} rotation={[0, 0.6, 0.55]}>
        <mesh material={m.woodDark} castShadow>
          <cylinderGeometry args={[0.025, 0.03, 0.75, 8]} />
        </mesh>
      </group>
    </group>
  );
}

function HoneyJar({ m, seg }: { m: Materials; seg: number }) {
  const glass = useMemo(() => vessel(JAR_PROFILE, 0.015, seg), [seg]);
  return (
    <group>
      <mesh material={m.honey} position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.255, 0.25, 0.46, seg]} />
      </mesh>
      <mesh geometry={glass} material={m.glass} />
      <mesh material={m.lid} position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.235, 0.235, 0.07, seg]} />
      </mesh>
    </group>
  );
}

function NavatPlate({ m, seg, lite }: { m: Materials; seg: number; lite: boolean }) {
  const crystals = useMemo(() => {
    const rand = seeded(7);
    return Array.from({ length: lite ? 9 : 16 }, () => {
      const a = rand() * Math.PI * 2;
      const r = rand() * 0.32;
      return {
        position: [Math.cos(a) * r, 0.08 + rand() * 0.12, Math.sin(a) * r] as [
          number,
          number,
          number,
        ],
        rotation: [rand() * 3, rand() * 3, rand() * 3] as [number, number, number],
        scale: 0.06 + rand() * 0.07,
      };
    });
  }, [lite]);
  return (
    <group>
      <mesh material={m.ceramic} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.36, 0.06, seg]} />
      </mesh>
      <mesh material={m.rim} position={[0, 0.031, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.47, 0.01, 6, seg]} />
      </mesh>
      {crystals.map((c, i) => (
        <mesh
          key={i}
          material={m.navat}
          position={c.position}
          rotation={c.rotation}
          scale={c.scale}
          castShadow
        >
          <octahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
    </group>
  );
}

function ButterBowl({ m, seg }: { m: Materials; seg: number }) {
  return (
    <group>
      <Piyala m={m} seg={seg} />
      <mesh material={m.butter} position={[0, 0.2, 0]} scale={[1, 0.45, 1]} castShadow>
        <sphereGeometry args={[0.27, seg, seg / 2]} />
      </mesh>
    </group>
  );
}

function ZhupkaStack({ m, seg }: { m: Materials; seg: number }) {
  // Thin layered flatbreads, slightly shifted.
  return (
    <group>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={i}
          material={i % 2 ? m.breadDark : m.bread}
          position={[Math.sin(i * 1.7) * 0.03, 0.02 + i * 0.035, Math.cos(i * 1.3) * 0.03]}
          rotation-y={i}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.5 - i * 0.01, 0.5, 0.03, seg]} />
        </mesh>
      ))}
    </group>
  );
}

function KattamaBoard({ m, seg }: { m: Materials; seg: number }) {
  // Wooden board with a layered, spiralled flatbread cut into pieces.
  return (
    <group>
      <mesh material={m.wood} castShadow receiveShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.06, seg]} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          material={m.bread}
          position={[0, 0.1, 0]}
          rotation-y={(i / 6) * Math.PI * 2}
          castShadow
        >
          <cylinderGeometry
            args={[0.68, 0.7, 0.08, Math.max(4, seg / 6), 1, false, 0.04, (Math.PI * 2) / 6 - 0.08]}
          />
        </mesh>
      ))}
      <mesh material={m.breadDark} position={[0, 0.142, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.36, 0.012, 6, seg]} />
      </mesh>
    </group>
  );
}

function Teapot({ m, seg }: { m: Materials; seg: number }) {
  const body = useMemo(() => {
    const g = new THREE.LatheGeometry(
      TEAPOT_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)),
      seg
    );
    g.computeVertexNormals();
    return g;
  }, [seg]);
  const spout = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.3, 0.14, 0),
          new THREE.Vector3(0.46, 0.24, 0),
          new THREE.Vector3(0.55, 0.4, 0),
        ]),
        12,
        0.035,
        8
      ),
    []
  );
  return (
    <group>
      <mesh geometry={body} material={m.ceramic} castShadow />
      <mesh geometry={spout} material={m.ceramic} castShadow />
      <mesh material={m.ceramic} position={[-0.34, 0.26, 0]} rotation-z={Math.PI / 2}>
        <torusGeometry args={[0.11, 0.025, 8, 16, Math.PI]} />
      </mesh>
      <mesh material={m.rim} position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.05, 12, 8]} />
      </mesh>
      <mesh material={m.rim} position={[0, 0.3, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.352, 0.012, 6, seg]} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0.1, 0.35), []);
  useEffect(() => {
    if (!reducedMotion) camera.position.set(0, 11, 13.5); // start further away, dolly in
  }, [camera, reducedMotion]);
  useFrame((_, delta) => {
    if (reducedMotion) return;
    camera.position.x = damp(camera.position.x, 0, 2, delta);
    camera.position.y = damp(camera.position.y, CAMERA[1], 2, delta);
    camera.position.z = damp(camera.position.z, CAMERA[2], 2, delta);
    camera.lookAt(target);
  });
  return null;
}

function Composition({
  lite,
  reducedMotion,
  locale,
}: Pick<SceneOptions, 'lite' | 'reducedMotion' | 'locale'>) {
  const group = useRef<THREE.Group>(null);
  const m = useMaterials(lite);
  const router = useRouter();
  const seg = lite ? 24 : 48;
  const open = (query: string) => () =>
    router.push(`/${locale}/catalog?search=${encodeURIComponent(query)}`);

  useEffect(() => () => Object.values(m).forEach((material) => material.dispose()), [m]);

  // Gentle turn towards the cursor (TZ §7.2): small angles, smooth damping.
  useFrame((state, delta) => {
    const g = group.current;
    if (!g || reducedMotion) return;
    g.rotation.y = damp(
      g.rotation.y,
      state.pointer.x * 0.28 + Math.sin(state.clock.elapsedTime * 0.15) * 0.05,
      3,
      delta
    );
    g.rotation.x = damp(g.rotation.x, -state.pointer.y * 0.06, 3, delta);
  });

  const props = { reducedMotion };
  return (
    <group ref={group}>
      <Dastorkon m={m} lite={lite} />
      <Item {...props} label="Каттама" position={[0, 0, 0]} delay={0.2} onSelect={open('Каттама')}>
        <KattamaBoard m={m} seg={seg} />
      </Item>
      <Item
        {...props}
        label="Кымыз"
        position={[-1.75, 0, -0.85]}
        delay={0.35}
        onSelect={open('Кымыз')}
      >
        <KymyzBowl m={m} seg={seg} />
      </Item>
      <Item {...props} label="Бал" position={[1.65, 0, -0.95]} delay={0.5} onSelect={open('Бал')}>
        <HoneyJar m={m} seg={seg} />
      </Item>
      <Item
        {...props}
        label="Нават"
        position={[-1.7, 0, 1.0]}
        delay={0.65}
        onSelect={open('Нават')}
      >
        <NavatPlate m={m} seg={seg} lite={lite} />
      </Item>
      <Item
        {...props}
        label="Сары май"
        position={[1.55, 0, 1.05]}
        delay={0.8}
        onSelect={open('Сары май')}
      >
        <ButterBowl m={m} seg={seg} />
      </Item>
      <Item
        {...props}
        label="Жупка"
        position={[0.05, 0, 1.75]}
        delay={0.95}
        onSelect={open('Жупка')}
      >
        <ZhupkaStack m={m} seg={seg} />
      </Item>
      <Item {...props} position={[0.1, 0, -1.85]} delay={1.1}>
        <Teapot m={m} seg={seg} />
      </Item>
      {!lite && (
        <>
          <Item {...props} position={[-0.75, 0, -1.55]} delay={1.2}>
            <Piyala m={m} seg={seg} />
          </Item>
          <Item {...props} position={[0.95, 0, -1.75]} delay={1.25}>
            <Piyala m={m} seg={seg} />
          </Item>
        </>
      )}
    </group>
  );
}

/** Keeps a "demand" canvas fresh after hydration of lazy textures. */
function InvalidateOnce() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const id = setTimeout(() => invalidate(), 100);
    return () => clearTimeout(id);
  }, [invalidate]);
  return null;
}

export default function DastorkonScene({
  lite,
  reducedMotion,
  active,
  locale,
  onError,
}: SceneOptions) {
  return (
    <Canvas
      // Only render frames while visible; a static frame for reduced motion.
      frameloop={!active ? 'never' : reducedMotion ? 'demand' : 'always'}
      dpr={lite ? [1, 1.5] : [1, 1.75]}
      shadows={!lite}
      camera={{ fov: 30, near: 0.1, far: 60, position: CAMERA }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: lite ? 'low-power' : 'high-performance',
      }}
      onCreated={({ gl, camera }) => {
        camera.lookAt(0, 0.1, 0.35);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.domElement.addEventListener('webglcontextlost', () => onError?.(), { once: true });
      }}
      aria-hidden
    >
      <hemisphereLight args={['#FFF6DD', '#2A4732', 0.55]} />
      <directionalLight
        position={[3.5, 7, 4]}
        intensity={1.6}
        color="#FFF1D6"
        castShadow={!lite}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0005}
        shadow-radius={6}
      />
      <Suspense fallback={null}>
        {/* Studio-like reflections from in-scene light panels: no HDR download. */}
        <Environment resolution={lite ? 32 : 128} frames={1}>
          <Lightformer
            form="rect"
            intensity={2.2}
            color="#FFF4DC"
            position={[0, 5, 3]}
            scale={[8, 4, 1]}
          />
          <Lightformer
            form="rect"
            intensity={0.9}
            color="#F4E9B9"
            position={[-5, 2, -2]}
            rotation-y={Math.PI / 3}
            scale={[5, 3, 1]}
          />
          <Lightformer
            form="ring"
            intensity={0.6}
            color="#4D7A55"
            position={[4, 1, -4]}
            scale={3}
          />
        </Environment>
        <CameraRig reducedMotion={reducedMotion} />
        <Composition lite={lite} reducedMotion={reducedMotion} locale={locale} />
        <ContactShadows
          position={[0, -0.09, 0]}
          opacity={0.45}
          scale={9}
          blur={2.6}
          far={3}
          resolution={lite ? 256 : 512}
          frames={1}
          color="#27452F"
        />
        <InvalidateOnce />
      </Suspense>
    </Canvas>
  );
}
