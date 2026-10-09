/*
 * Procedural background toolkit.
 *
 * Shared by the page-background generators in this folder: a seeded random
 * source, value noise, and `paintCrt`, which turns a per-pixel phosphor level
 * into the house look (one green ink ramp on a dark ground, scanlines, film
 * grain, a few torn rows) and writes the 1536 × 1024 JPEG source that
 * `PhosphorField` samples.
 */

import sharp from "sharp";

const WIDTH = 1536;
const HEIGHT = 1024;

const GROUND = [3, 8, 5] as const;
const INK = [34, 255, 132] as const;
const HOT = [190, 255, 216] as const;

const LATTICE = 256;

type Random = () => number;

type Noise = {
  readonly value: (x: number, y: number) => number;
  readonly fbm: (x: number, y: number) => number;
};

/** Phosphor level at a pixel: `level` 0..1 on the ink ramp, `hot` toward white. */
type Shade = { readonly level: number; readonly hot: number };

const createRandom = (seed: number): Random => {
  let a = seed >>> 0;
  return (): number => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const smooth = (t: number): number => t * t * (3 - 2 * t);

const smoothstep = (edge0: number, edge1: number, x: number): number =>
  smooth(Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0))));

const createNoise = (random: Random): Noise => {
  const lattice = Float32Array.from({ length: LATTICE * LATTICE }, () =>
    random(),
  );
  const at = (ix: number, iy: number): number =>
    lattice[
      (((iy % LATTICE) + LATTICE) % LATTICE) * LATTICE +
        (((ix % LATTICE) + LATTICE) % LATTICE)
    ]!;
  const value = (x: number, y: number): number => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const tx = smooth(x - xi);
    const ty = smooth(y - yi);
    const top = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * tx;
    const bottom = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * tx;
    return top + (bottom - top) * ty;
  };
  const fbm = (x: number, y: number): number =>
    value(x, y) * 0.55 +
    value(x * 2.1 + 17, y * 2.1 + 31) * 0.3 +
    value(x * 4.3 + 53, y * 4.3 + 7) * 0.15;
  return { value, fbm };
};

/** A few horizontal bands torn sideways, like a CRT losing sync. */
const tornRows = (random: Random): Int16Array => {
  const shift = new Int16Array(HEIGHT);
  for (let band = 0; band < 7; band += 1) {
    const start = Math.floor(random() * HEIGHT);
    const size = 2 + Math.floor(random() * 9);
    const offset = Math.round((random() - 0.5) * 36);
    for (let y = start; y < Math.min(HEIGHT, start + size); y += 1) {
      shift[y] = offset;
    }
  }
  return shift;
};

/** Shade every pixel through the CRT treatment and write the JPEG source. */
const paintCrt = async (
  target: string,
  random: Random,
  noise: Noise,
  shade: (x: number, y: number) => Shade,
): Promise<void> => {
  const torn = tornRows(random);
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);

  for (let y = 0; y < HEIGHT; y += 1) {
    const scanRow = y % 3 === 0 ? 0.82 : 1;
    const shift = torn[y]!;

    for (let x = 0; x < WIDTH; x += 1) {
      const sx = x - shift;
      const grain = (random() - 0.5) * 0.05;
      const haze = noise.fbm(sx * 0.002, y * 0.002) * 0.05;
      const { level, hot } = shade(sx, y);
      const lit = Math.min(1, Math.max(0, (level + haze + grain) * scanRow));

      const offset = (y * WIDTH + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        const ink = GROUND[channel]! + (INK[channel]! - GROUND[channel]!) * lit;
        const value = ink + (HOT[channel]! - ink) * hot * 0.6;
        pixels[offset + channel] = Math.max(
          0,
          Math.min(255, Math.round(value)),
        );
      }
    }
  }

  await sharp(pixels, { raw: { width: WIDTH, height: HEIGHT, channels: 3 } })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(target);
};

export { HEIGHT, WIDTH, createNoise, createRandom, paintCrt, smoothstep };
export type { Noise, Random, Shade };
