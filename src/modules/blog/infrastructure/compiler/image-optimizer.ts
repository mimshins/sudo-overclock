/*
 * Build-time image optimization.
 *
 * Local raster images are content-addressed and transcoded here so the
 * compiler can emit cacheable, modern-format markup. For each image we:
 *
 *   1. hash the source bytes plus the transform parameters to derive a
 *      deterministic filename suffix (never hashing the encoded output, which
 *      varies across libvips versions);
 *   2. copy the variants from the image store on a hit; otherwise auto-orient
 *      (EXIF), downscale to `maxWidth` without upscaling, encode AVIF + WebP +
 *      a same-format fallback, and save them to the store;
 *   3. return the produced filenames so the caller can rewrite the markup.
 *
 * SVG, animated images, and undecodable files are passed through unchanged
 * under a hashed name; the caller emits a plain `<img>` for those. Decoding
 * and encoding go through an injectable `ImageEncoder` (sharp by default,
 * see `image-encoder.ts`).
 */

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

import {
  PICTURE_SOURCES,
  TRANSFORM,
  sharpImageEncoder,
  type FallbackExtension,
  type ImageEncoder,
  type ImageTraits,
} from "./image-encoder.ts";
import type { StoredImage } from "./image-sidecar.ts";
import {
  createImageStore,
  type ImageStore,
  type VariantPath,
} from "./image-store.ts";

type ImageSource = {
  readonly type: string;
  readonly fileName: string;
};

type PreparedImage =
  | {
      readonly kind: "picture";
      readonly sources: readonly ImageSource[];
      readonly fallbackFileName: string;
      readonly width: number;
      readonly height: number;
    }
  | {
      readonly kind: "plain";
      readonly fileName: string;
    };

type PrepareImageOptions = {
  readonly encoder?: ImageEncoder;
  readonly store?: ImageStore | null;
};

const HASH_LENGTH = 12;
const SVG_EXTENSION = ".svg";

const contentHash = (source: Buffer): string =>
  createHash("sha256")
    .update(source)
    .update(JSON.stringify(TRANSFORM))
    .digest("hex")
    .slice(0, HASH_LENGTH);

const passthrough = async (
  source: Buffer,
  targetDir: string,
  baseName: string,
  hash: string,
  extension: string,
): Promise<PreparedImage> => {
  const fileName = `${baseName}.${hash}${extension}`;
  await writeFile(join(targetDir, fileName), source);
  return { kind: "plain", fileName };
};

/**
 * Encodes a raster image into `output`; `null` (after a warning) on a decode or
 * encode failure, which the caller ships as-is and never stores.
 */
const encodeImage = async (
  source: Buffer,
  sourcePath: string,
  encoder: ImageEncoder,
  output: VariantPath,
): Promise<StoredImage | null> => {
  let traits: ImageTraits;

  try {
    traits = await encoder.inspect(source);
  } catch {
    process.stderr.write(
      `[compile] could not decode image, copying as-is: ${sourcePath}\n`,
    );
    return null;
  }

  if (traits.animated) {
    return { kind: "plain" };
  }

  const fallbackExtension: FallbackExtension = traits.hasAlpha ? "png" : "jpg";

  try {
    const { width, height } = await encoder.encode(source, {
      fallbackExtension,
      output,
    });

    return {
      kind: "picture",
      sources: PICTURE_SOURCES,
      fallbackExtension,
      width,
      height,
    };
  } catch {
    process.stderr.write(
      `[compile] could not encode image, copying as-is: ${sourcePath}\n`,
    );
    return null;
  }
};

const prepareImage = async (
  sourcePath: string,
  targetDir: string,
  baseName: string,
  options: PrepareImageOptions = {},
): Promise<PreparedImage> => {
  const { encoder = sharpImageEncoder, store } = options;
  const source = await readFile(sourcePath);
  const hash = contentHash(source);
  const sourceExtension = extname(sourcePath).toLowerCase() || ".bin";

  if (sourceExtension === SVG_EXTENSION) {
    return passthrough(source, targetDir, baseName, hash, sourceExtension);
  }

  const variantFileName = (extension: string): string =>
    `${baseName}.${hash}.${extension}`;
  const target: VariantPath = extension =>
    join(targetDir, variantFileName(extension));

  const restored = (await store?.restore(hash, target)) ?? null;
  const image =
    restored ?? (await encodeImage(source, sourcePath, encoder, target));

  if (restored === null && image !== null) {
    await store?.save(hash, image, target);
  }

  if (image?.kind !== "picture") {
    return passthrough(source, targetDir, baseName, hash, sourceExtension);
  }

  return {
    kind: "picture",
    sources: image.sources.map(({ type, extension }) => ({
      type,
      fileName: variantFileName(extension),
    })),
    fallbackFileName: variantFileName(image.fallbackExtension),
    width: image.width,
    height: image.height,
  };
};

type ImageOptimizerOptions = {
  /** Image store root; `null` disables the store. */
  readonly cacheDir: string | null;
  /** Defaults to sharp. */
  readonly encoder?: ImageEncoder;
};

type ImageOptimizer = {
  /** Shared by every `prepareImage` call of one compile. */
  readonly options: PrepareImageOptions;
  /** Prunes the image store; a no-op without one. */
  readonly prune: () => Promise<void>;
};

const createImageOptimizer = ({
  cacheDir,
  encoder = sharpImageEncoder,
}: ImageOptimizerOptions): ImageOptimizer => {
  const store =
    cacheDir === null
      ? null
      : createImageStore({ root: cacheDir, encoderId: encoder.id });

  return {
    options: { encoder, store },
    prune: async () => {
      await store?.prune();
    },
  };
};

export { createImageOptimizer, prepareImage };
export type {
  ImageOptimizer,
  ImageOptimizerOptions,
  PreparedImage,
  PrepareImageOptions,
};
