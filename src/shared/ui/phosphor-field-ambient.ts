/*
 * PhosphorField ambient glow — a rolling swell for touch screens.
 *
 * Devices without a hovering pointer get no pointer glow. Instead a train of
 * crests rolls across the field like a slow beam sweep: each crest is a line
 * that bends and thickens along its length as it travels, a dot lights while
 * the crest is within its reach, and the field's usual easing leaves an
 * afterglow behind it. Pure state; no DOM.
 */

import type { DotTarget } from "@repo/shared/ui/phosphor-field-core";

/** Seconds between two crests passing the same point. */
const PERIOD = 7.5;
/** Crest spacing as a share of the field's extent along the travel axis. */
const SPACING = 0.9;
const MIN_WAVELENGTH = 480;
/** Travel heading range, radians from +x: mostly downward, a little slanted. */
const HEADING_MIN = Math.PI * 0.36;
const HEADING_MAX = Math.PI * 0.64;
/** Crest half-width as a share of each dot's hover reach. */
const CREST = 0.5;
/** Along-crest thickness variation: 0 keeps it even, 1 pinches it shut. */
const SWELL_DEPTH = 0.55;

/** Bends of the crest line: amplitude (px), length (px), drift (rad/s). */
const BENDS = [
  { amplitude: 34, length: 560, drift: 0.35 },
  { amplitude: 12, length: 210, drift: -0.6 },
] as const;
const SWELL = { length: 380, drift: 0.5 } as const;

type AmbientState = {
  readonly nx: number;
  readonly ny: number;
  readonly target: DotTarget;
  time: number;
  front: number;
  wavelength: number;
};

const TAU = Math.PI * 2;

/** Signed distance from `along` to the nearest crest, in (-λ/2, λ/2]. */
const toNearestCrest = (along: number, wavelength: number): number => {
  const wrapped = along % wavelength;
  const positive = wrapped < 0 ? wrapped + wavelength : wrapped;
  return positive > wavelength / 2 ? positive - wavelength : positive;
};

const crestTarget = (
  state: AmbientState,
  x: number,
  y: number,
  reach: number,
): number => {
  const { nx, ny, time } = state;
  const along = x * nx + y * ny;
  const across = y * nx - x * ny;

  let bend = 0;
  for (const { amplitude, length, drift } of BENDS) {
    bend += amplitude * Math.sin((across / length) * TAU + time * drift);
  }
  const swell =
    1 -
    SWELL_DEPTH *
      (0.5 +
        0.5 * Math.sin((across / SWELL.length) * TAU + time * SWELL.drift));

  const distance = toNearestCrest(along - state.front - bend, state.wavelength);
  return Math.abs(distance) <= reach * CREST * swell ? 1 : 0;
};

const createAmbient = (random: () => number = Math.random): AmbientState => {
  const heading = HEADING_MIN + random() * (HEADING_MAX - HEADING_MIN);
  const state: AmbientState = {
    nx: Math.cos(heading),
    ny: Math.sin(heading),
    time: random() * 60,
    front: 0,
    wavelength: MIN_WAVELENGTH,
    target: (x, y, reach) => crestTarget(state, x, y, reach),
  };
  return state;
};

/** Roll the crests forward by `dt` seconds over a `width`×`height` field. */
const stepAmbient = (
  state: AmbientState,
  dt: number,
  width: number,
  height: number,
): DotTarget => {
  const extent = Math.abs(width * state.nx) + Math.abs(height * state.ny);
  state.wavelength = Math.max(MIN_WAVELENGTH, extent * SPACING);
  state.time += dt;
  state.front =
    (state.front + (state.wavelength / PERIOD) * dt) % state.wavelength;
  return state.target;
};

export { createAmbient, stepAmbient };
export type { AmbientState };
