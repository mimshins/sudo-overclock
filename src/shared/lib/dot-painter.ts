/*
 * Dot painter — paints a pointillist layer into an RGBA buffer without a
 * canvas, for build-time renderers such as share cards.
 *
 * `paintImageDots` samples one source pixel per cell (dense photo dots with
 * grain); `paintProceduralDots` draws a sparse neutral dither plus a frozen
 * hover patch stepped toward an ink colour. Both take a `DotStyle`, which the
 * live field's styles satisfy, so callers reuse those values and state their
 * overrides. A quiet zone thins dots by density where text sits. Seeded, so
 * output is byte-stable.
 */

import type { Rgb } from "@repo/shared/lib/css-tokens";
import { mulberry32 } from "@repo/shared/lib/random";

type DotStyle = {
  readonly pitch: number;
  readonly skip: number;
  readonly sizeMin: number;
  readonly sizeMax: number;
  readonly alphaMin: number;
  readonly alphaMax: number;
  readonly grain: number;
  readonly radiusMin: number;
  readonly radiusMax: number;
};

type QuietZone = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly keep: number;
  readonly feather: number;
};

type Canvas = {
  readonly width: number;
  readonly height: number;
  readonly background: Rgb;
  readonly quiet: QuietZone;
};

type CellSource = {
  readonly cols: number;
  readonly rows: number;
  readonly data: Uint8Array | Uint8ClampedArray;
};

type LitPatch = {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
};

const SEED = 0x5eed;
const LIT_STEPS = 6;

const fillBackground = ({
  width,
  height,
  background,
}: Canvas): Uint8ClampedArray => {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = background[0];
    pixels[i + 1] = background[1];
    pixels[i + 2] = background[2];
    pixels[i + 3] = 255;
  }
  return pixels;
};

const quietKeep = (quiet: QuietZone, x: number, y: number): number => {
  const outside = Math.max(
    quiet.left - x,
    x - quiet.right,
    quiet.top - y,
    y - quiet.bottom,
    0,
  );
  if (outside >= quiet.feather) return 1;
  return quiet.keep + (1 - quiet.keep) * (outside / quiet.feather);
};

const blendSquare = (
  pixels: Uint8ClampedArray,
  canvas: Canvas,
  x: number,
  y: number,
  size: number,
  color: Rgb,
  alpha: number,
): void => {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(canvas.width, x0 + size);
  const y1 = Math.min(canvas.height, y0 + size);

  for (let py = y0; py < y1; py += 1) {
    for (let px = x0; px < x1; px += 1) {
      const offset = (py * canvas.width + px) * 4;
      pixels[offset] = pixels[offset]! + (color[0] - pixels[offset]!) * alpha;
      pixels[offset + 1] =
        pixels[offset + 1]! + (color[1] - pixels[offset + 1]!) * alpha;
      pixels[offset + 2] =
        pixels[offset + 2]! + (color[2] - pixels[offset + 2]!) * alpha;
    }
  }
};

const mix = (from: Rgb, to: Rgb, amount: number): Rgb => [
  Math.round(from[0] + (to[0] - from[0]) * amount),
  Math.round(from[1] + (to[1] - from[1]) * amount),
  Math.round(from[2] + (to[2] - from[2]) * amount),
];

const shade = (channel: number, factor: number): number =>
  Math.max(0, Math.min(255, Math.round(channel * factor)));

const between = (random: () => number, min: number, max: number): number =>
  min + random() * (max - min);

const jitter = (random: () => number, pitch: number): number =>
  (random() - 0.5) * pitch * 0.5;

const dotSize = (random: () => number, style: DotStyle): number =>
  style.sizeMin + Math.floor(random() * (style.sizeMax - style.sizeMin + 1));

const imageGrid = (width: number, height: number, pitch: number) => ({
  cols: Math.ceil(width / pitch),
  rows: Math.ceil(height / pitch),
});

const paintImageDots = (
  canvas: Canvas,
  source: CellSource,
  style: DotStyle,
  gain = 1,
): Uint8ClampedArray => {
  const pixels = fillBackground(canvas);
  const random = mulberry32(SEED);
  const { pitch } = style;

  for (let row = 0; row < source.rows; row += 1) {
    for (let col = 0; col < source.cols; col += 1) {
      if (random() < style.skip) continue;
      const x = col * pitch + jitter(random, pitch);
      const y = row * pitch + jitter(random, pitch);
      const size = dotSize(random, style);
      const alpha = between(random, style.alphaMin, style.alphaMax);
      const factor = (1 + (random() - 0.5) * style.grain * 2) * gain;
      if (random() > quietKeep(canvas.quiet, x, y)) continue;

      const offset = (row * source.cols + col) * 4;
      const color: Rgb = [
        shade(source.data[offset] ?? 0, factor),
        shade(source.data[offset + 1] ?? 0, factor),
        shade(source.data[offset + 2] ?? 0, factor),
      ];
      blendSquare(pixels, canvas, x, y, size, color, alpha);
    }
  }

  return pixels;
};

const paintProceduralDots = (
  canvas: Canvas,
  style: DotStyle,
  base: Rgb,
  ink: Rgb,
  patch: LitPatch,
): Uint8ClampedArray => {
  const pixels = fillBackground(canvas);
  const random = mulberry32(SEED);
  const { pitch } = style;
  const { cols, rows } = imageGrid(canvas.width, canvas.height, pitch);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (random() < style.skip) continue;
      const x = col * pitch + jitter(random, pitch);
      const y = row * pitch + jitter(random, pitch);
      const size = dotSize(random, style);
      const alpha0 = between(random, style.alphaMin, style.alphaMax);
      const reach =
        patch.radius * between(random, style.radiusMin, style.radiusMax);
      if (random() > quietKeep(canvas.quiet, x, y)) continue;

      const distance = Math.hypot(x - patch.x, y - patch.y);
      const state = Math.max(0, 1 - distance / reach);
      const level = Math.floor(state * LIT_STEPS) / LIT_STEPS;
      blendSquare(
        pixels,
        canvas,
        x,
        y,
        Math.round(size * (1 + 0.6 * level)),
        mix(base, ink, level),
        alpha0 + (1 - alpha0) * level,
      );
    }
  }

  return pixels;
};

export type { Canvas, CellSource, DotStyle, LitPatch, QuietZone };
export { imageGrid, paintImageDots, paintProceduralDots, quietKeep };
