/*
 * PhosphorField hover — the interactive (home) animation loop.
 *
 * Owns the pointer listeners, the growing hover wave, per-dot state easing,
 * the random pop-in reveal, the wobble refresh cadence, and the lit-layer
 * paint on top of the (session-provided) neutral offscreen layer. Without a
 * hovering pointer (touch screens) the glow follows the rolling swell in
 * `phosphor-field-ambient.ts` instead.
 */

import {
  stepAmbient,
  type AmbientState,
} from "@repo/shared/ui/phosphor-field-ambient";
import {
  WAVE_FADE_RATE,
  WAVE_GROWTH_RATE,
  hoverTarget,
  stepField,
  type DotField,
  type DotTarget,
  type HoverSource,
  type Rgb,
} from "@repo/shared/ui/phosphor-field-core";
import {
  renderLitLayer,
  renderNeutralLayer,
} from "@repo/shared/ui/phosphor-field-render";
import {
  REVEAL_FRAMES,
  createRandomReveal,
  revealStep,
  type RevealState,
} from "@repo/shared/ui/phosphor-field-reveal";

const BASE_REFRESH_INTERVAL = 0.05;

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

const NO_SOURCES: readonly HoverSource[] = [];

type HoverAnimatorOptions = {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly baseContext: CanvasRenderingContext2D;
  readonly base: Rgb;
  readonly phosphor: Rgb;
  readonly levelColors: readonly string[];
  /** Swell state owned by the session so rebuilds continue it seamlessly. */
  readonly ambient: AmbientState;
  /** Blit the offscreen neutral layer onto the visible canvas. */
  readonly onPaint: () => void;
};

class HoverAnimator {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly baseContext: CanvasRenderingContext2D;
  private readonly base: Rgb;
  private readonly phosphor: Rgb;
  private readonly levelColors: readonly string[];
  private readonly onPaint: () => void;
  private readonly reducedQuery: MediaQueryList;
  private readonly pointerQuery: MediaQueryList;
  private field: DotField | null = null;
  private width = 0;
  private height = 0;
  private reduced: boolean;
  private readonly ambient: AmbientState;
  private swell = false;
  private reveal: RevealState | null = null;
  private hoverX: number | null = null;
  private hoverY: number | null = null;
  private wave = 0;
  private frame = 0;
  private last = 0;
  private baseAccum = BASE_REFRESH_INTERVAL;

  constructor(options: HoverAnimatorOptions) {
    this.canvas = options.canvas;
    this.context = options.context;
    this.baseContext = options.baseContext;
    this.base = options.base;
    this.phosphor = options.phosphor;
    this.levelColors = options.levelColors;
    this.ambient = options.ambient;
    this.onPaint = options.onPaint;
    this.reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reduced = this.reducedQuery.matches;
    this.pointerQuery = window.matchMedia(FINE_POINTER);
  }

  /** `reveal` pops the dots in at random; otherwise they show at once. */
  start(
    field: DotField | null,
    width: number,
    height: number,
    reveal: boolean,
  ): void {
    this.stop();
    this.field = field;
    this.width = width;
    this.height = height;
    this.wave = 0;
    this.baseAccum = BASE_REFRESH_INTERVAL;
    this.hoverX = null;
    this.hoverY = null;

    this.baseContext.clearRect(0, 0, width, height);
    this.reveal =
      field !== null && reveal && !this.reduced
        ? createRandomReveal(field.state.length, field.active, field.blocked)
        : null;
    if (field !== null && this.reveal === null) {
      this.paintNeutral(performance.now());
    }
    if (field === null) return;

    this.followPointer(this.pointerQuery.matches);
    this.pointerQuery.addEventListener("change", this.onPointerChange);
    this.reducedQuery.addEventListener("change", this.onReducedChange);

    this.last = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.frame !== 0) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.unfollowPointer();
    this.pointerQuery.removeEventListener("change", this.onPointerChange);
    this.reducedQuery.removeEventListener("change", this.onReducedChange);
  }

  private followPointer(fine: boolean): void {
    this.unfollowPointer();
    this.hoverX = null;
    this.hoverY = null;

    this.swell = !fine;
    if (this.swell) return;

    window.addEventListener("pointermove", this.onPointerMove, {
      passive: true,
    });
    window.addEventListener("pointerleave", this.onPointerLeave);
  }

  private unfollowPointer(): void {
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerleave", this.onPointerLeave);
  }

  private glowTarget(dt: number): DotTarget {
    if (this.swell) {
      return stepAmbient(this.ambient, dt, this.width, this.height);
    }
    return hoverTarget(this.hoverSources(dt));
  }

  private hoverSources(dt: number): readonly HoverSource[] {
    if (this.hoverX !== null && this.hoverY !== null) {
      this.wave = Math.min(1, this.wave + dt * WAVE_GROWTH_RATE);
      return [{ x: this.hoverX, y: this.hoverY, wave: this.wave }];
    }

    this.wave = Math.max(0, this.wave - dt * WAVE_FADE_RATE);
    return NO_SOURCES;
  }

  private paintNeutral(now: number): void {
    const field = this.field;
    if (field === null) return;

    renderNeutralLayer(
      this.baseContext,
      field,
      this.width,
      this.height,
      now,
      this.reduced,
      this.base,
      this.reveal?.mask ?? null,
    );
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    this.hoverX = inside ? event.clientX - rect.left : null;
    this.hoverY = inside ? event.clientY - rect.top : null;
  };
  private readonly onPointerLeave = (): void => {
    this.hoverX = null;
    this.hoverY = null;
  };
  private readonly onReducedChange = (event: MediaQueryListEvent): void => {
    this.reduced = event.matches;
  };
  private readonly onPointerChange = (event: MediaQueryListEvent): void => {
    this.followPointer(event.matches);
  };

  private readonly tick = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    const field = this.field;
    if (field === null) return;

    const reveal = this.reveal;
    if (reveal !== null && reveal.index < reveal.total) {
      revealStep(reveal, Math.max(1, Math.ceil(reveal.total / REVEAL_FRAMES)));
    }
    const revealPending = reveal !== null && reveal.index < reveal.total;
    const mask = this.reveal?.mask ?? null;

    stepField(field, dt, this.glowTarget(dt));

    let refresh = false;
    if (field.wobble > 0) {
      this.baseAccum += dt;
      if (this.baseAccum >= BASE_REFRESH_INTERVAL || revealPending) {
        this.baseAccum = 0;
        refresh = true;
      }
    } else if (revealPending) {
      refresh = true;
    }
    if (refresh) this.paintNeutral(now);

    this.onPaint();

    renderLitLayer(
      this.context,
      field,
      now,
      this.reduced,
      this.levelColors,
      this.phosphor,
      mask,
    );

    this.frame = requestAnimationFrame(this.tick);
  };
}

export { HoverAnimator };
export type { HoverAnimatorOptions };
