/*
 * PhosphorField reveal — random pop-in plus drifting motion for the static
 * photo field (blog page).
 *
 * Dots appear in a shuffled (random) order over a few frames instead of a
 * row-scan, then keep roaming/wiggling like the home page by redrawing the
 * neutral layer at a low cadence so each dot's wave offset moves.
 */

import type { DotField, Rgb } from "./phosphor-field-core.ts";
import { renderNeutralRows } from "./phosphor-field-render.ts";

const REFRESH_INTERVAL = 0.05;
const REVEAL_FRAMES = 24;

export type RevealState = {
  /** 1 once a dot has popped in. */
  readonly mask: Uint8Array;
  /** Shuffled indices of the dots to reveal. */
  readonly order: Uint32Array;
  readonly total: number;
  index: number;
};

/** Shuffle every drawable (active, unblocked) dot into a reveal order. */
const createRandomReveal = (
  count: number,
  active: Uint8Array,
  blocked: Uint8Array,
): RevealState | null => {
  const order: number[] = [];
  for (let i = 0; i < count; i += 1) {
    if (active[i] === 1 && blocked[i] === 0) order.push(i);
  }
  if (order.length === 0) return null;

  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = order[i]!;
    order[i] = order[j]!;
    order[j] = tmp;
  }

  return {
    mask: new Uint8Array(count),
    order: Uint32Array.from(order),
    total: order.length,
    index: 0,
  };
};

/** Mark the next `budget` shuffled dots as revealed. */
const revealStep = (state: RevealState, budget: number): void => {
  const end = Math.min(state.total, state.index + budget);
  for (; state.index < end; state.index += 1) {
    state.mask[state.order[state.index]!] = 1;
  }
};

type StaticAnimatorOptions = {
  readonly context: CanvasRenderingContext2D;
  readonly field: DotField;
  readonly width: number;
  readonly height: number;
  readonly base: Rgb;
  /** Called after each repaint so the caller can blit the base layer. */
  readonly onPaint: () => void;
};

/** Runs the random pop-in and then the perpetual drift of the static field. */
class StaticAnimator {
  private readonly context: CanvasRenderingContext2D;
  private readonly field: DotField;
  private readonly width: number;
  private readonly height: number;
  private readonly base: Rgb;
  private readonly onPaint: () => void;
  private readonly reveal: RevealState | null;
  private frame = 0;
  private last = performance.now();
  private baseAccum = 0;

  constructor(options: StaticAnimatorOptions) {
    const { context, field, width, height, base, onPaint } = options;
    this.context = context;
    this.field = field;
    this.width = width;
    this.height = height;
    this.base = base;
    this.onPaint = onPaint;
    this.reveal = createRandomReveal(
      field.state.length,
      field.active,
      field.blocked,
    );
  }

  start(): void {
    this.render(performance.now());
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.frame !== 0) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private render(now: number): void {
    const mask = this.reveal?.mask ?? null;
    this.context.clearRect(0, 0, this.width, this.height);
    renderNeutralRows(
      this.context,
      this.field,
      now,
      false,
      this.base,
      0,
      this.field.rows,
      mask,
    );
    this.onPaint();
  }

  private readonly tick = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    const reveal = this.reveal;
    let dirty = false;

    if (reveal !== null && reveal.index < reveal.total) {
      revealStep(reveal, Math.max(1, Math.ceil(reveal.total / REVEAL_FRAMES)));
      dirty = true;
    } else if (this.field.wobble > 0) {
      this.baseAccum += dt;
      if (this.baseAccum >= REFRESH_INTERVAL) {
        this.baseAccum = 0;
        dirty = true;
      }
    }

    if (dirty) this.render(now);

    const hasMore = reveal !== null && reveal.index < reveal.total;
    this.frame =
      hasMore || this.field.wobble > 0 ? requestAnimationFrame(this.tick) : 0;
  };
}

export { REVEAL_FRAMES, StaticAnimator, createRandomReveal, revealStep };
