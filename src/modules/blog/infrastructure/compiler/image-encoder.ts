/*
 * Image encoding recipe and the default sharp encoder.
 *
 * `TRANSFORM` feeds the content hash (and therefore the URL); the full recipe
 * (`TRANSFORM` plus `ENCODE_RECIPE`) and the sharp/libvips versions form the
 * encoder id, so any change to how variants are produced starts a fresh image
 * store instead of reusing stale variants.
 */

import { createHash } from "node:crypto";

import sharp from "sharp";

import { withEncodeSlot } from "./concurrency.ts";
import type { VariantPath } from "./image-store.ts";

type FallbackExtension = "png" | "jpg";

type ImageTraits = {
  readonly animated: boolean;
  readonly hasAlpha: boolean;
};

type EncodeRequest = {
  readonly fallbackExtension: FallbackExtension;
  /** Where to write each variant, by extension (`avif`, `webp`, fallback). */
  readonly output: VariantPath;
};

type ImageEncoder = {
  /** Identifies the encoder build; a change invalidates the image store. */
  readonly id: string;
  /** Reads the header metadata the encode decision needs. */
  readonly inspect: (source: Buffer) => Promise<ImageTraits>;
  /** Writes every variant and resolves to the encoded intrinsic size. */
  readonly encode: (
    source: Buffer,
    request: EncodeRequest,
  ) => Promise<{ readonly width: number; readonly height: number }>;
};

const TRANSFORM = {
  maxWidth: 2048,
  avifQuality: 55,
  webpQuality: 80,
  jpegQuality: 82,
} as const;

const PICTURE_SOURCES = [
  { type: "image/avif", extension: "avif" },
  { type: "image/webp", extension: "webp" },
] as const;

const ENCODE_RECIPE = {
  pictureSources: PICTURE_SOURCES,
  resize: { fit: "inside", withoutEnlargement: true },
  png: { compressionLevel: 9 },
  jpeg: { progressive: true },
} as const;

const RECIPE_HASH_LENGTH = 8;

type EncoderIdInput = {
  readonly sharpVersion: string;
  readonly vipsVersion: string;
  readonly recipe: unknown;
};

const buildEncoderId = ({
  sharpVersion,
  vipsVersion,
  recipe,
}: EncoderIdInput): string => {
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(recipe))
    .digest("hex")
    .slice(0, RECIPE_HASH_LENGTH);

  return `sharp-${sharpVersion}-vips-${vipsVersion}-r${fingerprint}`;
};

const encodeSource = (source: Buffer) =>
  sharp(source)
    .rotate()
    .resize({ width: TRANSFORM.maxWidth, ...ENCODE_RECIPE.resize });

const sharpImageEncoder: ImageEncoder = {
  id: buildEncoderId({
    sharpVersion: sharp.versions.sharp ?? "unknown",
    vipsVersion: sharp.versions.vips,
    recipe: { transform: TRANSFORM, encode: ENCODE_RECIPE },
  }),
  inspect: async source => {
    const metadata = await sharp(source).metadata();

    return {
      animated: metadata.pages !== undefined && metadata.pages > 1,
      hasAlpha: metadata.hasAlpha,
    };
  },
  encode: async (source, { fallbackExtension, output }) => {
    const pipeline = encodeSource(source);

    const [avifInfo] = await Promise.all([
      withEncodeSlot(() =>
        pipeline
          .clone()
          .avif({ quality: TRANSFORM.avifQuality })
          .toFile(output("avif")),
      ),
      withEncodeSlot(() =>
        pipeline
          .clone()
          .webp({ quality: TRANSFORM.webpQuality })
          .toFile(output("webp")),
      ),
      withEncodeSlot(() => {
        const fallback = pipeline.clone();

        return (
          fallbackExtension === "png"
            ? fallback.png(ENCODE_RECIPE.png)
            : fallback.jpeg({
                quality: TRANSFORM.jpegQuality,
                ...ENCODE_RECIPE.jpeg,
              })
        ).toFile(output(fallbackExtension));
      }),
    ]);

    return { width: avifInfo.width, height: avifInfo.height };
  },
};

export {
  ENCODE_RECIPE,
  PICTURE_SOURCES,
  TRANSFORM,
  buildEncoderId,
  sharpImageEncoder,
};
export type { EncodeRequest, FallbackExtension, ImageEncoder, ImageTraits };
