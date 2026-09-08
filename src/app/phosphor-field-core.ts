/*
 * PhosphorField core — pure helpers for the dithered dot field.
 *
 * No React here: dot-field generation, per-step easing toward a hover target,
 * and the canvas rendering are framework-agnostic so they stay unit-testable
 * and out of the client component's bundle shape.
 */

type Rgb = readonly [number, number, number];

export type DotField = {
  readonly cols: number;
  readonly rows: number;
  readonly active: Uint8Array;
  readonly blocked: Uint8Array;
  readonly size: Float32Array;
  readonly alpha0: Float32Array;
  readonly seedX: Float32Array;
  readonly seedY: Float32Array;
  readonly offsetX: Float32Array;
  readonly offsetY: Float32Array;
  readonly radius: Float32Array;
  readonly state: Float32Array;
};

const PITCH = 8;
const STEP_COUNT = 6;
const HOVER_RADIUS = 56;
const RISE_RATE = 4;
const FALL_RATE = 2.4;
const WAVE_GROWTH_RATE = 2.8;
const WAVE_FADE_RATE = 1.6;
const WAVE_AMP = 1.2;
const SKIP_PROBABILITY = 0.24;
const BLOCK_PROBABILITY = 0.12;

const FALLBACK_BASE: Rgb = [140, 140, 140];
const FALLBACK_PHOSPHOR: Rgb = [0, 255, 156];

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return (): number => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const parseRgb = (value: string): Rgb | null => {
  const match = /(\d+),\s*(\d+),\s*(\d+)/u.exec(value);
  if (match === null) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

const resolveToken = (name: string, fallback: Rgb): Rgb => {
  if (typeof document === "undefined") return fallback;

  const probe = document.createElement("span");
  probe.style.color = `var(${name})`;
  probe.style.position = "fixed";
  probe.style.opacity = "0";
  probe.style.pointerEvents = "none";
  document.body.append(probe);

  const color = getComputedStyle(probe).color;
  probe.remove();

  return parseRgb(color) ?? fallback;
};

const createDotField = (width: number, height: number): DotField | null => {
  const cols = Math.ceil(width / PITCH);
  const rows = Math.ceil(height / PITCH);
  const count = cols * rows;

  if (count === 0) return null;

  const random = mulberry32(0x5eed);
  const active = new Uint8Array(count);
  const blocked = new Uint8Array(count);
  const size = new Float32Array(count);
  const alpha0 = new Float32Array(count);
  const seedX = new Float32Array(count);
  const seedY = new Float32Array(count);
  const offsetX = new Float32Array(count);
  const offsetY = new Float32Array(count);
  const radius = new Float32Array(count);
  const state = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    if (random() < SKIP_PROBABILITY) continue;

    active[i] = 1;
    blocked[i] = random() < BLOCK_PROBABILITY ? 1 : 0;
    size[i] = random() < 0.3 ? 2 : 1;
    alpha0[i] = 0.1 + random() * 0.22;
    seedX[i] = random() * Math.PI * 2;
    seedY[i] = random() * Math.PI * 2;
    offsetX[i] = (random() - 0.5) * PITCH * 0.5;
    offsetY[i] = (random() - 0.5) * PITCH * 0.5;
    radius[i] = HOVER_RADIUS * (0.55 + random() * 1.35);
  }

  return {
    cols,
    rows,
    active,
    blocked,
    size,
    alpha0,
    seedX,
    seedY,
    offsetX,
    offsetY,
    radius,
    state,
  };
};

const stepField = (
  field: DotField,
  dt: number,
  wave: number,
  hoverX: number | null,
  hoverY: number | null,
): void => {
  const { cols, active, blocked, state } = field;

  for (let i = 0; i < state.length; i += 1) {
    if (active[i] === 0 || blocked[i] === 1) continue;

    const col = i % cols;
    const row = Math.trunc(i / cols);
    const px = col * PITCH + field.offsetX[i]!;
    const py = row * PITCH + field.offsetY[i]!;

    let target = 0;
    if (hoverX !== null && hoverY !== null) {
      const dx = hoverX - px;
      const dy = hoverY - py;
      const reach = field.radius[i]! * wave;
      if (dx * dx + dy * dy <= reach * reach) target = 1;
    }

    const rate = target === 1 ? RISE_RATE : FALL_RATE;
    const next = state[i]! + (target - state[i]!) * Math.min(1, rate * dt);
    state[i] = next < 0.002 ? 0 : next > 0.998 ? 1 : next;
  }
};

const mix = (from: number, to: number, amount: number): number =>
  Math.round(from + (to - from) * amount);

/** One cached `rgb(...)` fill color per phosphor step. */
const buildLevelColors = (base: Rgb, phosphor: Rgb): string[] => {
  const colors: string[] = [];

  for (let step = 0; step <= STEP_COUNT; step += 1) {
    const level = step / STEP_COUNT;
    colors.push(
      `rgb(${mix(base[0], phosphor[0], level)}, ${mix(base[1], phosphor[1], level)}, ${mix(base[2], phosphor[2], level)})`,
    );
  }

  return colors;
};

const waveOffset = (
  field: DotField,
  index: number,
  t: number,
  amp: number,
): readonly [number, number] => {
  const waveX =
    Math.sin(field.seedX[index]! + t * 1.4) * amp +
    Math.sin(field.seedY[index]! * 2.1 + t * 0.7) * amp * 0.5;
  const waveY =
    Math.cos(field.seedY[index]! + t * 1.1) * amp +
    Math.sin(field.seedX[index]! * 2.3 + t * 0.9) * amp * 0.5;

  return [waveX, waveY];
};

const dotPosition = (
  field: DotField,
  index: number,
  t: number,
  amp: number,
): readonly [number, number] => {
  const col = index % field.cols;
  const row = Math.trunc(index / field.cols);
  const [waveX, waveY] = waveOffset(field, index, t, amp);

  return [
    col * PITCH + field.offsetX[index]! + waveX,
    row * PITCH + field.offsetY[index]! + waveY,
  ];
};

/** Neutral dots — drawn at a low cadence onto the cached base layer. */
const renderNeutralLayer = (
  context: CanvasRenderingContext2D,
  field: DotField,
  width: number,
  height: number,
  now: number,
  reduced: boolean,
  base: Rgb,
): void => {
  const { active, blocked } = field;
  const t = now * 0.001;
  const amp = reduced ? 0 : WAVE_AMP;
  const color = `rgb(${base[0]}, ${base[1]}, ${base[2]})`;

  context.clearRect(0, 0, width, height);
  context.fillStyle = color;

  for (let i = 0; i < active.length; i += 1) {
    if (active[i] === 0 || blocked[i] === 1) continue;

    const [px, py] = dotPosition(field, i, t, amp);
    context.globalAlpha = field.alpha0[i]!;
    context.fillRect(px, py, field.size[i]!, field.size[i]!);
  }

  context.globalAlpha = 1;
};

/** Lit dots — drawn every frame over the cached base layer. */
const renderLitLayer = (
  context: CanvasRenderingContext2D,
  field: DotField,
  now: number,
  reduced: boolean,
  colors: readonly string[],
): void => {
  const { active, blocked, state } = field;
  const t = now * 0.001;
  const amp = reduced ? 0 : WAVE_AMP;

  for (let i = 0; i < state.length; i += 1) {
    const value = state[i];
    if (
      value === undefined ||
      active[i] === 0 ||
      blocked[i] === 1 ||
      value === 0
    )
      continue;

    const step = Math.floor(value * STEP_COUNT);
    const [px, py] = dotPosition(field, i, t, amp);
    const size = field.size[i]! * (1 + 0.6 * (step / STEP_COUNT));

    context.globalAlpha =
      field.alpha0[i]! + (1 - field.alpha0[i]!) * (step / STEP_COUNT);
    context.fillStyle = colors[step]!;
    context.fillRect(px, py, size, size);
  }

  context.globalAlpha = 1;
};

export {
  FALLBACK_BASE,
  FALLBACK_PHOSPHOR,
  WAVE_FADE_RATE,
  WAVE_GROWTH_RATE,
  buildLevelColors,
  createDotField,
  renderLitLayer,
  renderNeutralLayer,
  resolveToken,
  stepField,
};
