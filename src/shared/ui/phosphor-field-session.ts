/*
 * PhosphorField session — canvas lifecycle and composition.
 *
 * It owns the offscreen neutral layer and hands animation off to one of two
 * controllers: a HoverAnimator when `glowOnHover` (home, random pop-in reveal
 * + pointer glow + drift) or a StaticAnimator when off (blog, random pop-in
 * + drift, no glow).
 *
 * Resizes are coalesced and cheap: a container that only gets shorter at the
 * same width (a mobile browser's toolbar sliding in) skips the rebuild and
 * crops the bitmap via `object-fit`, and a rebuild never replays the pop-in.
 */

import { createAmbient } from "@repo/shared/ui/phosphor-field-ambient";
import {
  IMAGE_STYLE,
  PROCEDURAL_STYLE,
  createDotField,
  type DotField,
  type Rgb,
} from "@repo/shared/ui/phosphor-field-core";
import { HoverAnimator } from "@repo/shared/ui/phosphor-field-hover";
import {
  requestImage,
  sampleImage,
  type CachedImage,
} from "@repo/shared/ui/phosphor-field-image";
import {
  FALLBACK_BASE,
  FALLBACK_PHOSPHOR,
  fieldRender,
  inkFromLuminance,
  resolveToken,
  type FieldRender,
} from "@repo/shared/ui/phosphor-field-ink";
import {
  buildLevelColors,
  renderNeutralRows,
} from "@repo/shared/ui/phosphor-field-render";
import { StaticAnimator } from "@repo/shared/ui/phosphor-field-reveal";

const MAX_DPR = 2;

const INK_GAIN = 2.4;

const RESIZE_SETTLE_MS = 150;

class PhosphorSession {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly baseLayer: HTMLCanvasElement;
  private readonly baseContext: CanvasRenderingContext2D;
  private readonly container: HTMLElement;
  private base: Rgb;
  private phosphor: Rgb;
  private levelColors: readonly string[];
  private render: FieldRender;
  private readonly reducedQuery: MediaQueryList;
  private readonly observer: ResizeObserver;
  private readonly image: CachedImage | null;
  private readonly glowOnHover: boolean;
  private readonly ambient = createAmbient();
  private reduced: boolean;
  private dpr = 1;
  private field: DotField | null = null;
  private hover: HoverAnimator | null = null;
  private animator: StaticAnimator | null = null;
  private width = 0;
  private height = 0;
  private imageFailed = false;
  private revealed = false;
  private resizeTimer = 0;
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
    this.glowOnHover = glowOnHover;
    const phosphor = resolveToken("--color-phosphor", FALLBACK_PHOSPHOR);
    this.base = resolveToken("--color-foreground-tertiary", FALLBACK_BASE);
    this.phosphor = phosphor;
    this.levelColors = buildLevelColors(this.base, phosphor);
    this.render = fieldRender();
    this.baseLayer = document.createElement("canvas");
    const baseContext = this.baseLayer.getContext("2d");
    if (baseContext === null) {
      throw new Error("phosphor field: could not allocate the base layer");
    }
    this.baseContext = baseContext;
    this.reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reduced = this.reducedQuery.matches;
    this.observer = new ResizeObserver(() => {
      this.scheduleResize();
    });
    this.image = src === null ? null : this.attachImage(src);
  }

  private attachImage(src: string): CachedImage {
    const entry = requestImage(src);
    if (entry.image() === null) void this.awaitImage(entry);
    return entry;
  }

  private async awaitImage(entry: CachedImage): Promise<void> {
    const image = await entry.ready;
    this.imageFailed = image === null;
    if (!this.disposed) this.layout();
  }

  start(): void {
    this.layout();
    this.observer.observe(this.container);
    this.reducedQuery.addEventListener("change", this.onReducedChange);
  }

  refreshColors(): void {
    this.phosphor = resolveToken("--color-phosphor", FALLBACK_PHOSPHOR);
    this.base = resolveToken("--color-foreground-tertiary", FALLBACK_BASE);
    this.levelColors = buildLevelColors(this.base, this.phosphor);
    this.render = fieldRender();
    this.dropHover();
    this.layout();
  }

  stop(): void {
    this.disposed = true;
    this.cancelResize();
    this.reducedQuery.removeEventListener("change", this.onReducedChange);
    this.dropHover();
    this.animator?.stop();
    this.animator = null;
    this.observer.disconnect();
  }

  private cancelResize(): void {
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = 0;
  }

  private scheduleResize(): void {
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(
      this.onResizeSettled,
      RESIZE_SETTLE_MS,
    );
  }

  private readonly onResizeSettled = (): void => {
    this.resizeTimer = 0;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === this.width && height <= this.height) return;
    this.layout();
  };

  private layout(): void {
    if (this.disposed) return;
    this.cancelResize();

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

    const reveal = !this.revealed && this.field !== null;
    if (reveal) this.revealed = true;

    if (this.glowOnHover && !this.reduced) {
      this.startInteractive(reveal);
    } else {
      this.dropHover();
      this.startStatic(reveal);
    }
  }

  private readonly onReducedChange = (event: MediaQueryListEvent): void => {
    this.reduced = event.matches;
    this.layout();
  };

  private dropHover(): void {
    this.hover?.stop();
    this.hover = null;
  }

  private startInteractive(reveal: boolean): void {
    this.hover ??= new HoverAnimator({
      canvas: this.canvas,
      context: this.context,
      baseContext: this.baseContext,
      base: this.base,
      phosphor: this.phosphor,
      levelColors: this.levelColors,
      ambient: this.ambient,
      onPaint: (): void => {
        this.composite();
      },
    });
    this.hover.start(this.field, this.width, this.height, reveal);
  }

  private startStatic(reveal: boolean): void {
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
      reveal,
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
    if (this.image === null || this.imageFailed) {
      this.field = createDotField(
        this.width,
        this.height,
        PROCEDURAL_STYLE,
        null,
      );
      return;
    }

    const source = sampleImage(
      this.image,
      this.width,
      this.height,
      IMAGE_STYLE.pitch,
    );
    const field =
      source === null
        ? null
        : createDotField(this.width, this.height, IMAGE_STYLE, source);

    if (field !== null && this.render === "ink") {
      inkFromLuminance(field, this.phosphor, INK_GAIN);
    }

    this.field = field;
  }
}

export { PhosphorSession };
