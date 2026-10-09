/** PhosphorField core — pure dot-field generation and hover easing. No DOM. */
import { mulberry32 } from "@repo/shared/lib/random";

export type Rgb = readonly [number, number, number];

export type FieldStyle = {
  /** Grid pitch in CSS pixels — one dot slot per `pitch`×`pitch` cell. */
  readonly pitch: number;
  /** Probability a grid cell is left empty (dither gaps). */
  readonly skip: number;
  /** Probability a dot never lights up under the pointer. */
  readonly block: number;
  /** Smallest dot side in CSS pixels (inclusive). */
  readonly sizeMin: number;
  /** Largest dot side in CSS pixels (inclusive). */
  readonly sizeMax: number;
  /** Base opacity range of the neutral dots. */
  readonly alphaMin: number;
  readonly alphaMax: number;
  /** Per-dot luminance grain, 0..1 — sampled colours scale by `1 ± grain`. */
  readonly grain: number;
  /** Base hover reach in CSS pixels (multiplied by radiusMin/radiusMax jitter). */
  readonly hoverRadius: number;
  /** Per-dot jitter multipliers applied to `hoverRadius`. */
  readonly radiusMin: number;
  readonly radiusMax: number;
  /** Wobble amplitude in CSS pixels (forced to 0 under reduced motion). */
  readonly wobble: number;
};

export type DotField = {
  readonly cols: number;
  readonly rows: number;
  readonly pitch: number;
  readonly wobble: number;
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
  /** Per-dot RGB (3 bytes per dot), set only when the field samples an image. */
  readonly rgb: Uint8ClampedArray | null;
  /** Cached `rgb(...)` neutral fills per dot, set only in image mode. */
  readonly fill: string[] | null;
};

/**
 * Whether the dot at (x, y) should light: 1 lights it, 0 lets it decay. `reach`
 * is the dot's own jittered radius, so edges dither.
 */
export type DotTarget = (x: number, y: number, reach: number) => number;

/** A point that lights the dots within `wave` × each dot's radius of it. */
export type HoverSource = {
  readonly x: number;
  readonly y: number;
  readonly wave: number;
};

/** Raw RGBA pixels (stride 4) of a source image at dot-grid resolution. */
export type ImageSource = {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
};

const RISE_RATE = 4;
const FALL_RATE = 2.4;
const WAVE_GROWTH_RATE = 2.8;
const WAVE_FADE_RATE = 1.6;

const FIELD_SEED = 0x5eed;

/** Look of the home page field: sparse dithered neutral mask. */
export const PROCEDURAL_STYLE: FieldStyle = {
  pitch: 8,
  skip: 0.24,
  block: 0.12,
  sizeMin: 1,
  sizeMax: 2,
  alphaMin: 0.1,
  alphaMax: 0.32,
  grain: 0,
  hoverRadius: 56,
  radiusMin: 0.55,
  radiusMax: 1.9,
  wobble: 1.2,
};

/** Blog field: dense, grainy pointillism of a photo that drifts like home. */
export const IMAGE_STYLE: FieldStyle = {
  pitch: 4,
  skip: 0.01,
  block: 0.02,
  sizeMin: 2,
  sizeMax: 4,
  alphaMin: 0.82,
  alphaMax: 1,
  grain: 0.18,
  hoverRadius: 56,
  radiusMin: 0.6,
  radiusMax: 1.7,
  wobble: 1.2,
};

/**
 * Each cell draws its traits from a generator seeded by its grid position, so a
 * resized field keeps every dot that survives the resize exactly in place.
 */
const cellRandom = (col: number, row: number): (() => number) =>
  mulberry32(
    Math.imul(col + 1, 0x9e3779b1) ^
      Math.imul(row + 1, 0x85ebca6b) ^
      FIELD_SEED,
  );

/**
 * Sample a dot's cell colour into rgb/fill. `image` is the cover-cropped photo
 * downscaled to the grid itself, so cell (col, row) maps straight to a pixel.
 */
const writeImageSample = (
  buffers: FieldBuffers,
  image: ImageSource,
  index: number,
  cols: number,
  factor: number,
): void => {
  const rgb = buffers.rgb!;
  const fill = buffers.fill!;
  const col = index % cols;
  const row = Math.trunc(index / cols);
  const offset = (row * image.width + col) * 4;
  const shade = (channel: number): number =>
    Math.max(0, Math.min(255, Math.round(channel * factor)));
  const r = shade(image.data[offset]!);
  const g = shade(image.data[offset + 1]!);
  const b = shade(image.data[offset + 2]!);
  rgb[index * 3] = r;
  rgb[index * 3 + 1] = g;
  rgb[index * 3 + 2] = b;
  fill[index] = `rgb(${r}, ${g}, ${b})`;
};

type FieldBuffers = {
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
  readonly rgb: Uint8ClampedArray | null;
  readonly fill: string[] | null;
};

const allocateField = (count: number, sampled: boolean): FieldBuffers => ({
  active: new Uint8Array(count),
  blocked: new Uint8Array(count),
  size: new Float32Array(count),
  alpha0: new Float32Array(count),
  seedX: new Float32Array(count),
  seedY: new Float32Array(count),
  offsetX: new Float32Array(count),
  offsetY: new Float32Array(count),
  radius: new Float32Array(count),
  state: new Float32Array(count),
  rgb: sampled ? new Uint8ClampedArray(count * 3) : null,
  fill: sampled ? Array.from<string>({ length: count }) : null,
});

const populateField = (
  buffers: FieldBuffers,
  style: FieldStyle,
  image: ImageSource | null,
  cols: number,
): void => {
  const {
    active,
    blocked,
    size,
    alpha0,
    seedX,
    seedY,
    offsetX,
    offsetY,
    radius,
  } = buffers;

  for (let i = 0; i < buffers.state.length; i += 1) {
    const random = cellRandom(i % cols, Math.trunc(i / cols));
    if (random() < style.skip) continue;

    active[i] = 1;
    blocked[i] = random() < style.block ? 1 : 0;
    size[i] =
      style.sizeMin +
      Math.floor(random() * (style.sizeMax - style.sizeMin + 1));
    alpha0[i] = style.alphaMin + random() * (style.alphaMax - style.alphaMin);
    seedX[i] = random() * Math.PI * 2;
    seedY[i] = random() * Math.PI * 2;
    offsetX[i] = (random() - 0.5) * style.pitch * 0.5;
    offsetY[i] = (random() - 0.5) * style.pitch * 0.5;
    radius[i] =
      style.hoverRadius *
      (style.radiusMin + random() * (style.radiusMax - style.radiusMin));

    if (buffers.rgb !== null && buffers.fill !== null && image !== null) {
      const factor = 1 + (random() - 0.5) * style.grain * 2;
      writeImageSample(buffers, image, i, cols, factor);
    }
  }
};

const createDotField = (
  width: number,
  height: number,
  style: FieldStyle,
  image: ImageSource | null,
): DotField | null => {
  const cols = Math.ceil(width / style.pitch);
  const rows = Math.ceil(height / style.pitch);
  const count = cols * rows;

  if (count === 0) return null;

  const buffers = allocateField(count, image !== null);
  populateField(buffers, style, image, cols);

  return {
    cols,
    rows,
    pitch: style.pitch,
    wobble: style.wobble,
    ...buffers,
  };
};

const NO_TARGET: DotTarget = () => 0;

const hoverTarget = (sources: readonly HoverSource[]): DotTarget =>
  sources.length === 0
    ? NO_TARGET
    : (x, y, reach) => {
        for (const source of sources) {
          const dx = source.x - x;
          const dy = source.y - y;
          const radius = reach * source.wave;
          if (dx * dx + dy * dy <= radius * radius) return 1;
        }
        return 0;
      };

const stepField = (field: DotField, dt: number, target: DotTarget): void => {
  const { cols, active, blocked, state } = field;

  for (let i = 0; i < state.length; i += 1) {
    if (active[i] === 0 || blocked[i] === 1) continue;

    const col = i % cols;
    const row = Math.trunc(i / cols);
    const px = col * field.pitch + field.offsetX[i]!;
    const py = row * field.pitch + field.offsetY[i]!;

    const goal = target(px, py, field.radius[i]!);
    const rate = goal === 1 ? RISE_RATE : FALL_RATE;
    const next = state[i]! + (goal - state[i]!) * Math.min(1, rate * dt);
    state[i] = next < 0.002 ? 0 : next > 0.998 ? 1 : next;
  }
};

export {
  WAVE_FADE_RATE,
  WAVE_GROWTH_RATE,
  createDotField,
  hoverTarget,
  stepField,
};
