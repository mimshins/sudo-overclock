/*
 * PhosphorField image helpers — decoding support for the pointillist mode.
 *
 * Decoded sources are cached for the lifetime of the page, keyed by URL, so a
 * field that remounts (client-side navigation, theme change) never re-fetches
 * or re-decodes its photo. Each entry also keeps its last few grid samples,
 * so repainting at an unchanged size skips the downscale and pixel readback.
 */

import type { ImageSource } from "@repo/shared/ui/phosphor-field-core";

const SAMPLES_PER_IMAGE = 2;

type CachedImage = {
  /** Resolves to the decoded image, or null when it failed to load. */
  readonly ready: Promise<HTMLImageElement | null>;
  /** The decoded image once `ready` has settled successfully. */
  readonly image: () => HTMLImageElement | null;
  readonly samples: Map<string, Uint8ClampedArray>;
};

const cache = new Map<string, CachedImage>();

const requestImage = (src: string): CachedImage => {
  const cached = cache.get(src);
  if (cached !== undefined) return cached;

  const element = new Image();
  element.decoding = "async";
  element.src = src;

  let decoded: HTMLImageElement | null = null;
  const ready = element.decode().then(
    (): HTMLImageElement => {
      decoded = element;
      return element;
    },
    (): null => {
      cache.delete(src);
      return null;
    },
  );

  const entry: CachedImage = {
    ready,
    image: () => decoded,
    samples: new Map(),
  };
  cache.set(src, entry);
  return entry;
};

/** Draw the image cover-fit onto a grid canvas and return its RGBA pixels. */
const drawSample = (
  image: HTMLImageElement,
  width: number,
  height: number,
): Uint8ClampedArray | null => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (context === null) return null;

  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  );

  return context.getImageData(0, 0, width, height).data;
};

/**
 * The decoded entry cover-fit to a `pitch` dot grid over `width`×`height` CSS
 * pixels, memoized per grid size; null until the image has decoded.
 */
const sampleImage = (
  entry: CachedImage,
  width: number,
  height: number,
  pitch: number,
): ImageSource | null => {
  const image = entry.image();
  if (image === null || image.naturalWidth === 0) return null;

  const cols = Math.max(1, Math.ceil(width / pitch));
  const rows = Math.max(1, Math.ceil(height / pitch));
  const key = `${cols}x${rows}`;
  const hit = entry.samples.get(key);
  if (hit !== undefined) return { width: cols, height: rows, data: hit };

  const data = drawSample(image, cols, rows);
  if (data === null) return null;

  if (entry.samples.size >= SAMPLES_PER_IMAGE) {
    const oldest = entry.samples.keys().next().value;
    if (oldest !== undefined) entry.samples.delete(oldest);
  }
  entry.samples.set(key, data);
  return { width: cols, height: rows, data };
};

export { requestImage, sampleImage };
export type { CachedImage };
