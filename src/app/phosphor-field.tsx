"use client";

/*
 * PhosphorField — client component.
 *
 * A dithered, pointillist field of small square dots that sits behind the home
 * page content. Dots wobble with a slow noisy wave; hovering near a dot steps
 * its color from neutral toward phosphor in discrete stages, and stepping away
 * returns it to neutral over the same staged path. Rendered on a transparent
 * canvas so the CSS background + noise overlays still show through.
 *
 * Rendering is split in two for performance:
 *   - the neutral field is drawn to an offscreen layer and only refreshed at a
 *     low cadence (the wobble doesn't need 60fps), and
 *   - each frame only the small set of lit dots is drawn on top.
 */

import { useEffect, useRef } from "react";

import {
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
  type DotField,
} from "./phosphor-field-core.ts";

import styles from "./phosphor-field.module.css";

const MAX_DPR = 2;
const BASE_REFRESH_INTERVAL = 0.05;

class PhosphorSession {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly baseLayer: HTMLCanvasElement;
  private readonly baseContext: CanvasRenderingContext2D;
  private readonly container: HTMLElement;
  private readonly base: readonly [number, number, number];
  private readonly levelColors: readonly string[];
  private readonly reducedQuery: MediaQueryList;
  private readonly observer: ResizeObserver;
  private reduced: boolean;
  private dpr = 1;
  private field: DotField | null = null;
  private hoverX: number | null = null;
  private hoverY: number | null = null;
  private wave = 0;
  private frame = 0;
  private last = 0;
  private baseAccum = BASE_REFRESH_INTERVAL;
  private width = 0;
  private height = 0;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    const container = canvas.parentElement;

    if (context === null || container === null) {
      throw new Error("phosphor field: canvas needs a 2d context and a parent");
    }

    this.canvas = canvas;
    this.context = context;
    this.container = container;

    const phosphor = resolveToken("--color-phosphor", FALLBACK_PHOSPHOR);
    this.base = resolveToken("--color-foreground-tertiary", FALLBACK_BASE);
    this.levelColors = buildLevelColors(this.base, phosphor);

    this.baseLayer = document.createElement("canvas");
    const baseContext = this.baseLayer.getContext("2d");
    if (baseContext === null) {
      throw new Error("phosphor field: could not allocate the base layer");
    }
    this.baseContext = baseContext;

    this.reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reduced = this.reducedQuery.matches;

    this.observer = new ResizeObserver(() => {
      this.layout();
    });
  }

  start(): void {
    this.layout();
    this.observer.observe(this.container);

    window.addEventListener("pointermove", this.onPointerMove, {
      passive: true,
    });
    window.addEventListener("pointerleave", this.onPointerLeave);
    this.reducedQuery.addEventListener("change", this.onReducedChange);

    this.last = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  stop(): void {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerleave", this.onPointerLeave);
    this.reducedQuery.removeEventListener("change", this.onReducedChange);
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    if (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    ) {
      this.hoverX = event.clientX - rect.left;
      this.hoverY = event.clientY - rect.top;
    } else {
      this.hoverX = null;
      this.hoverY = null;
    }
  };

  private readonly onPointerLeave = (): void => {
    this.hoverX = null;
    this.hoverY = null;
  };

  private readonly onReducedChange = (event: MediaQueryListEvent): void => {
    this.reduced = event.matches;
  };

  private layout(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.canvas.width = Math.max(1, Math.round(this.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.height * this.dpr));
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.baseLayer.width = this.canvas.width;
    this.baseLayer.height = this.canvas.height;
    this.baseContext.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.wave = 0;
    this.baseAccum = BASE_REFRESH_INTERVAL;
    this.field = createDotField(this.width, this.height);

    this.refreshBaseLayer(performance.now());
  }

  private refreshBaseLayer(now: number): void {
    if (this.field === null) return;

    renderNeutralLayer(
      this.baseContext,
      this.field,
      this.width,
      this.height,
      now,
      this.reduced,
      this.base,
    );
  }

  private readonly tick = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    if (this.hoverX !== null && this.hoverY !== null) {
      this.wave = Math.min(1, this.wave + dt * WAVE_GROWTH_RATE);
    } else {
      this.wave = Math.max(0, this.wave - dt * WAVE_FADE_RATE);
    }

    if (this.field !== null) {
      stepField(this.field, dt, this.wave, this.hoverX, this.hoverY);

      this.baseAccum += dt;
      if (this.baseAccum >= BASE_REFRESH_INTERVAL) {
        this.baseAccum = 0;
        this.refreshBaseLayer(now);
      }

      this.context.setTransform(1, 0, 0, 1, 0, 0);
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.drawImage(this.baseLayer, 0, 0);
      this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      renderLitLayer(
        this.context,
        this.field,
        now,
        this.reduced,
        this.levelColors,
      );
    }

    this.frame = requestAnimationFrame(this.tick);
  };
}

const PhosphorField = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    let session: PhosphorSession | null = null;
    if (canvas !== null) {
      try {
        session = new PhosphorSession(canvas);
      } catch {
        session = null;
      }
    }

    if (session !== null) session.start();

    return () => {
      if (session !== null) session.stop();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={styles.field}
      aria-hidden="true"
      data-slot="phosphor-field"
    />
  );
};

export { PhosphorField };
