/*
 * Build-time image optimization.
 *
 * Local raster images are content-addressed and transcoded here so the
 * compiler can emit cacheable, modern-format markup. For each image we:
 *
 *   1. hash the source bytes plus the transform parameters to derive a
 *      deterministic filename suffix (never hashing the encoded output, which
 *      varies across libvips versions);
 *   2. auto-orient (EXIF), downscale to `maxWidth` without upscaling, and
 *      encode AVIF + WebP + a same-format fallback;
 *   3. return the produced filenames so the caller can rewrite the markup.
 *
 * SVG, animated images, and undecodable files are passed through unchanged
 * under a hashed name; the caller emits a plain `<img>` for those.
 */

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

import sharp, { type Metadata } from "sharp";

import { withEncodeSlot } from "./concurrency.ts";

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

const TRANSFORM = {
  maxWidth: 2048,
  avifQuality: 55,
  webpQuality: 80,
  jpegQuality: 82,
} as const;

const HASH_LENGTH = 12;
const SVG_EXTENSION = ".svg";

const contentHash = (source: Buffer): string =>
  createHash("sha256")
    .update(source)
    .update(JSON.stringify(TRANSFORM))
    .digest("hex")
    .slice(0, HASH_LENGTH);

const encodeSource = (source: Buffer) =>
  sharp(source).rotate().resize({
    width: TRANSFORM.maxWidth,
    withoutEnlargement: true,
    fit: "inside",
  });

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

const prepareImage = async (
  sourcePath: string,
  targetDir: string,
  baseName: string,
): Promise<PreparedImage> => {
  const source = await readFile(sourcePath);
  const hash = contentHash(source);
  const sourceExtension = extname(sourcePath).toLowerCase() || ".bin";

  if (sourceExtension === SVG_EXTENSION) {
    return passthrough(source, targetDir, baseName, hash, sourceExtension);
  }

  let metadata: Metadata;

  try {
    metadata = await sharp(source).metadata();
  } catch {
    process.stderr.write(
      `[compile] could not decode image, copying as-is: ${sourcePath}\n`,
    );
    return passthrough(source, targetDir, baseName, hash, sourceExtension);
  }

  if (metadata.pages !== undefined && metadata.pages > 1) {
    return passthrough(source, targetDir, baseName, hash, sourceExtension);
  }

  const fallbackExtension = metadata.hasAlpha ? "png" : "jpg";
  const avifFileName = `${baseName}.${hash}.avif`;
  const webpFileName = `${baseName}.${hash}.webp`;
  const fallbackFileName = `${baseName}.${hash}.${fallbackExtension}`;

  try {
    const pipeline = encodeSource(source);

    const [avifInfo] = await Promise.all([
      withEncodeSlot(() =>
        pipeline
          .clone()
          .avif({ quality: TRANSFORM.avifQuality })
          .toFile(join(targetDir, avifFileName)),
      ),
      withEncodeSlot(() =>
        pipeline
          .clone()
          .webp({ quality: TRANSFORM.webpQuality })
          .toFile(join(targetDir, webpFileName)),
      ),
      withEncodeSlot(() => {
        const fallback = pipeline.clone();

        return (
          fallbackExtension === "png"
            ? fallback.png({ compressionLevel: 9 })
            : fallback.jpeg({
                quality: TRANSFORM.jpegQuality,
                progressive: true,
              })
        ).toFile(join(targetDir, fallbackFileName));
      }),
    ]);

    return {
      kind: "picture",
      sources: [
        { type: "image/avif", fileName: avifFileName },
        { type: "image/webp", fileName: webpFileName },
      ],
      fallbackFileName,
      width: avifInfo.width,
      height: avifInfo.height,
    };
  } catch {
    process.stderr.write(
      `[compile] could not encode image, copying as-is: ${sourcePath}\n`,
    );
    return passthrough(source, targetDir, baseName, hash, sourceExtension);
  }
};

export { prepareImage };
export type { PreparedImage };
