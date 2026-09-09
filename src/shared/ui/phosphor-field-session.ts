/*
 * PhosphorField session — canvas lifecycle and composition.
 *
 * It owns the offscreen neutral layer and hands animation off to one of two
 * controllers: a HoverAnimator when `glowOnHover` (home, random pop-in reveal
 * + pointer glow + drift) or a StaticAnimator when off (blog, random pop-in
 * + drift, no glow).
 */

import {
  FALLBACK_BASE,
  FALLBACK_PHOSPHOR,
  IMAGE_STYLE,
  PROCEDURAL_STYLE,
  createDotField,
  resolveToken,
  type DotField,
  type ImageSource,
  type Rgb,
} from "./phosphor-field-core.ts";
import { HoverAnimator } from "./phosphor-field-hover.ts";
import { loadImage, sampleImage } from "./phosphor-field-image.ts";
import {
  buildLevelColors,
  renderNeutralRows,
} from "./phosphor-field-render.ts";
import { StaticAnimator } from "./phosphor-field-reveal.ts";

const MAX_DPR = 2;

class PhosphorSession {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly baseLayer: HTMLCanvasElement;
  private readonly baseContext: CanvasRenderingContext2D;
  private readonly container: HTMLElement;
  private readonly base: Rgb;
  private readonly phosphor: Rgb;
  private readonly levelColors: readonly string[];
  private readonly reducedQuery: MediaQueryList;
  private readonly observer: ResizeObserver;
  private readonly src: string | null;
  private readonly image: HTMLImageElement | null = null;
  private readonly glowOnHover: boolean;
  private reduced: boolean;
  private dpr = 1;
  private field: DotField | null = null;
  private hover: HoverAnimator | null = null;
  private animator: StaticAnimator | null = null;
  private width = 0;
  private height = 0;
  private imageReady = false;
  private imageFailed = false;
  private disposed = false;

  constructor(
    canvas: HTMLCanvasElement,
    src: string | null,
    glowOnHover: boolean,
  ) {
    const context = canvas.getContext("2d");
    const container = canvas.parentElement;
    if (context === null || container === null) {
      throw new Error("phosphor field: canvas needs a 2d context and a parent");
    }
    this.canvas = canvas;
    this.context = context;
    this.container = container;
    this.src = src;
    this.glowOnHover = glowOnHover;
    const phosphor = resolveToken("--color-phosphor", FALLBACK_PHOSPHOR);
    this.base = resolveToken("--color-foreground-tertiary", FALLBACK_BASE);
    this.phosphor = phosphor;
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
    if (src !== null) this.image = this.attachImage(src);
  }

  private attachImage(src: string): HTMLImageElement {
    return loadImage(src, (success: boolean): void => {
      this.imageReady = success;
      this.imageFailed = !success;
      if (!this.disposed) this.layout();
    });
  }

  start(): void {
    this.layout();
    this.observer.observe(this.container);
  }

  stop(): void {
    this.disposed = true;
    this.hover?.stop();
    this.hover = null;
    this.animator?.stop();
    this.animator = null;
    this.observer.disconnect();
  }

  private layout(): void {
    if (this.disposed) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.canvas.width = Math.max(1, Math.round(this.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.height * this.dpr));
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.baseLayer.width = this.canvas.width;
    this.baseLayer.height = this.canvas.height;
    this.baseContext.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.rebuildField();

    if (this.glowOnHover) {
      this.startInteractive();
    } else {
      this.startStatic();
    }
  }

  private startInteractive(): void {
    this.hover ??= new HoverAnimator({
      canvas: this.canvas,
      context: this.context,
      baseContext: this.baseContext,
      base: this.base,
      phosphor: this.phosphor,
      levelColors: this.levelColors,
      onPaint: (): void => {
        this.composite();
      },
    });
    this.hover.start(this.field, this.width, this.height);
  }

  private startStatic(): void {
    this.animator?.stop();
    this.animator = null;
    this.baseContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const field = this.field;
    if (field === null || field.rows === 0) {
      this.composite();
      return;
    }

    if (this.reduced) {
      renderNeutralRows(
        this.baseContext,
        field,
        performance.now(),
        true,
        this.base,
        0,
        field.rows,
      );
      this.composite();
      return;
    }

    this.animator = new StaticAnimator({
      context: this.baseContext,
      field,
      width: this.width,
      height: this.height,
      base: this.base,
      onPaint: (): void => {
        this.composite();
      },
    });
    this.animator.start();
  }

  private composite(): void {
    if (this.field === null) return;

    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(this.baseLayer, 0, 0);
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private rebuildField(): void {
    if (this.src === null || this.imageFailed) {
      this.field = createDotField(
        this.width,
        this.height,
        PROCEDURAL_STYLE,
        null,
      );
      return;
    }

    if (!this.imageReady || this.image === null) {
      this.field = null;
      return;
    }

    const gridCols = Math.max(1, Math.ceil(this.width / IMAGE_STYLE.pitch));
    const gridRows = Math.max(1, Math.ceil(this.height / IMAGE_STYLE.pitch));
    const data = sampleImage(this.image, gridCols, gridRows);
    if (data === null) {
      this.field = null;
      return;
    }

    const source: ImageSource = {
      width: gridCols,
      height: gridRows,
      data,
    };
    this.field = createDotField(this.width, this.height, IMAGE_STYLE, source);
  }
}

export { PhosphorSession };
