import * as THREE from 'three';

import { HORN_PATHS } from '@/components/brand/horn-paths';

/**
 * Procedural assets for the dastorkon scene. Everything is generated in code:
 * no model or texture downloads, tiny bundle, works offline.
 */

/** Hollow vessel from an outer profile (radius, height) with a wall thickness. */
export function vessel(profile: [number, number][], wall: number, segments: number) {
  const outer = profile.map(([r, y]) => new THREE.Vector2(r, y));
  const inner = [...profile]
    .reverse()
    .map(([r, y]) => new THREE.Vector2(Math.max(r - wall, 0.001), Math.max(y, wall)));
  const geometry = new THREE.LatheGeometry([...outer, ...inner], segments);
  geometry.computeVertexNormals();
  return geometry;
}

/** Piyala / kese: small handle-less bowl. */
export const BOWL_PROFILE: [number, number][] = [
  [0.001, 0],
  [0.16, 0],
  [0.18, 0.02],
  [0.26, 0.1],
  [0.31, 0.2],
  [0.33, 0.26],
];

/** Wooden kymyz bowl (ayak): wider and deeper. */
export const AYAK_PROFILE: [number, number][] = [
  [0.001, 0],
  [0.22, 0],
  [0.25, 0.04],
  [0.42, 0.16],
  [0.52, 0.3],
  [0.55, 0.38],
];

/** Teapot body. */
export const TEAPOT_PROFILE: [number, number][] = [
  [0.001, 0],
  [0.2, 0],
  [0.3, 0.06],
  [0.36, 0.2],
  [0.34, 0.34],
  [0.24, 0.44],
  [0.14, 0.48],
  [0.001, 0.49],
];

/** Glass honey jar. */
export const JAR_PROFILE: [number, number][] = [
  [0.001, 0],
  [0.24, 0],
  [0.27, 0.03],
  [0.28, 0.5],
  [0.24, 0.58],
  [0.22, 0.62],
];

/** Ornamental top of the dastorkon: cream field, green border and a ring of kochkor muyuz. */
export function createDastorkonTexture(size: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;

  ctx.fillStyle = '#F6EDC6';
  ctx.fillRect(0, 0, size, size);

  // Soft woven noise so the cloth does not look like plastic.
  const image = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    image.data[i] += n;
    image.data[i + 1] += n;
    image.data[i + 2] += n;
  }
  ctx.putImageData(image, 0, 0);

  const ring = (radius: number, width: number, color: string) => {
    ctx.beginPath();
    ctx.arc(c, c, radius, 0, Math.PI * 2);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  };
  ring(c * 0.97, c * 0.06, '#355B3E');
  ring(c * 0.9, c * 0.008, '#355B3E');
  ring(c * 0.62, c * 0.006, '#7D8456');

  const horns = HORN_PATHS.map((d) => new Path2D(d));
  const drawHorn = (angle: number, radius: number, scale: number, color: string) => {
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(angle);
    ctx.translate(0, -radius);
    ctx.scale(scale, scale);
    ctx.translate(-60, -30);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    horns.forEach((p) => ctx.stroke(p));
    ctx.restore();
  };
  for (let i = 0; i < 16; i++)
    drawHorn((i / 16) * Math.PI * 2, c * 0.8, (c / 512) * 0.9, '#355B3E');
  for (let i = 0; i < 8; i++)
    drawHorn((i / 8) * Math.PI * 2 + Math.PI / 8, c * 0.52, (c / 512) * 0.6, '#7D8456');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Deterministic pseudo-random numbers so the scene looks the same on every load. */
export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
