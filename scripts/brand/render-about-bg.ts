/*
 * About-page background generator.
 *
 * Renders the `PhosphorField` source for /about procedurally: a phosphor
 * fingerprint (whoami) mid-scan, the ridges above a bright sweep line already
 * read and lit, the rest still dim, on a dark CRT ground. Nothing is licensed
 * in: the output is fully determined by the seed below. The generated
 * `public/about/bg.jpg` is committed so builds never have to run this;
 * regenerate with `pnpm brand:backgrounds` after editing it.
 */

import { resolve } from "node:path";

import {
  createNoise,
  createRandom,
  paintCrt,
  smoothstep,
  type Shade,
} from "./raster.ts";

const projectRoot = resolve(import.meta.dirname, "../..");
const target = resolve(projectRoot, "public/about/bg.jpg");

const SEED = 0x0b0e;

const CENTER_X = 768;
const CENTER_Y = 488;
const TILT = -0.16;
const PAD_RX = 330;
const PAD_RY = 430;
const RIDGE_PERIOD = 15;
const SCAN_Y = 0.6;

const random = createRandom(SEED);
const noise = createNoise(random);
const { value, fbm } = noise;

const cos = Math.cos(TILT);
const sin = Math.sin(TILT);
const scanLine = CENTER_Y - PAD_RY + 2 * PAD_RY * SCAN_Y;

/** Ridge brightness (0..1) of the fingerprint at a source pixel. */
const fingerprint = (x: number, y: number): number => {
  const dx = x - CENTER_X;
  const dy = y - CENTER_Y;
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;

  const pad = Math.hypot(lx / PAD_RX, ly / PAD_RY);
  const edge =
    1 - smoothstep(0.8, 1, pad + (fbm(x * 0.012, y * 0.012) - 0.5) * 0.22);
  if (edge <= 0) return 0;

  const warp =
    (fbm(x * 0.0045, y * 0.0045) - 0.5) * 46 +
    (fbm(x * 0.011 + 71, y * 0.011 + 19) - 0.5) * 18;
  const core = Math.hypot(lx, (ly + 40) / 1.3);
  const spiral =
    (Math.atan2((ly + 40) / 1.3, lx) / (Math.PI * 2)) * RIDGE_PERIOD;
  const phase = ((core + spiral + warp) / RIDGE_PERIOD) * Math.PI * 2;
  const ridge = smoothstep(0.25, 0.85, 0.5 + 0.5 * Math.cos(phase));

  const breaks = fbm(x * 0.09 + 101, y * 0.09 + 211) > 0.77 ? 0.3 : 1;
  const pores = value(x * 0.35, y * 0.35) > 0.88 ? 0.45 : 1;

  return ridge * breaks * pores * edge;
};

/** Scan state: read rows above the sweep glow, rows below stay dim. */
const scanGain = (y: number): number =>
  y < scanLine ? 1 - smoothstep(0, 520, scanLine - y) * 0.45 : 0.22;

const sweep = (x: number, y: number): number => {
  const across =
    1 - smoothstep(PAD_RX * 0.9, PAD_RX * 1.6, Math.abs(x - CENTER_X));
  return Math.exp(-(((y - scanLine) / 3.5) ** 2)) * across;
};

const shade = (x: number, y: number): Shade => {
  const lit = fingerprint(x, y) * scanGain(y) * 0.7;
  const glow = sweep(x, y);
  return { level: lit + glow, hot: smoothstep(0.9, 1.2, lit + glow) };
};

await paintCrt(target, random, noise, shade);

console.log("rendered public/about/bg.jpg");
