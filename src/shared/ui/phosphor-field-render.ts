/*
 * PhosphorField renderers — canvas painting for the dot field.
 *
 * The two layers mirror the two render targets:
 *   - a neutral layer cached at a low cadence onto an offscreen canvas, and
 *   - a lit layer drawn each frame over the dots currently easing upward.
 *
 * Both add a slow sinusoidal wobble to each dot position.
 */

import type { DotField, Rgb } from "./phosphor-field-core.ts";

const STEP_COUNT = 6;

const mix = (from: number, to: number, amount: number): number =>
  Math.round(from + (to - from) * amount);

/** One cached `rgb(...)` fill colour per phosphor step for a fixed base. */
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
    col * field.pitch + field.offsetX[index]! + waveX,
    row * field.pitch + field.offsetY[index]! + waveY,
  ];
};

/**
 * Draw neutral dots in rows `[rowStart, rowEnd)` without clearing. An optional
 * per-dot `mask` (1 = drawn) lets dots appear progressively; a null mask draws
 * everything.
 */
const renderNeutralRows = (
  context: CanvasRenderingContext2D,
  field: DotField,
  now: number,
  reduced: boolean,
  base: Rgb,
  rowStart: number,
  rowEnd: number,
  mask: Uint8Array | null = null,
): void => {
  const { cols, active, blocked, fill } = field;
  const t = now * 0.001;
  const amp = reduced ? 0 : field.wobble;
  const uniform =
    fill === null ? `rgb(${base[0]}, ${base[1]}, ${base[2]})` : null;

  if (uniform !== null) context.fillStyle = uniform;

  for (let i = 0; i < active.length; i += 1) {
    if (active[i] === 0 || blocked[i] === 1) continue;
    if (mask !== null && mask[i] === 0) continue;

    const row = Math.trunc(i / cols);
    if (row < rowStart || row >= rowEnd) continue;

    if (uniform === null) context.fillStyle = fill![i]!;

    const [px, py] = dotPosition(field, i, t, amp);
    context.globalAlpha = field.alpha0[i]!;
    context.fillRect(px, py, field.size[i]!, field.size[i]!);
  }

  context.globalAlpha = 1;
};

/** Neutral dots — clear the canvas and draw every row at once. */
const renderNeutralLayer = (
  context: CanvasRenderingContext2D,
  field: DotField,
  width: number,
  height: number,
  now: number,
  reduced: boolean,
  base: Rgb,
  mask: Uint8Array | null = null,
): void => {
  context.clearRect(0, 0, width, height);
  renderNeutralRows(context, field, now, reduced, base, 0, field.rows, mask);
};

/** Lit dots — drawn every frame over the cached base layer. */
const renderLitLayer = (
  context: CanvasRenderingContext2D,
  field: DotField,
  now: number,
  reduced: boolean,
  colors: readonly string[],
  phosphor: Rgb,
  mask: Uint8Array | null = null,
): void => {
  const { active, blocked, state, rgb } = field;
  const t = now * 0.001;
  const amp = reduced ? 0 : field.wobble;

  for (let i = 0; i < state.length; i += 1) {
    const value = state[i];
    if (
      value === undefined ||
      active[i] === 0 ||
      blocked[i] === 1 ||
      value === 0 ||
      (mask !== null && mask[i] === 0)
    )
      continue;

    const step = Math.floor(value * STEP_COUNT);
    const level = step / STEP_COUNT;
    const [px, py] = dotPosition(field, i, t, amp);
    const size = field.size[i]! * (1 + 0.6 * level);

    if (rgb === null) {
      context.fillStyle = colors[step]!;
    } else {
      const r = rgb[i * 3]!;
      const g = rgb[i * 3 + 1]!;
      const b = rgb[i * 3 + 2]!;
      context.fillStyle = `rgb(${mix(r, phosphor[0], level)}, ${mix(g, phosphor[1], level)}, ${mix(b, phosphor[2], level)})`;
    }

    context.globalAlpha = field.alpha0[i]! + (1 - field.alpha0[i]!) * level;
    context.fillRect(px, py, size, size);
  }

  context.globalAlpha = 1;
};

export {
  buildLevelColors,
  renderLitLayer,
  renderNeutralLayer,
  renderNeutralRows,
};
