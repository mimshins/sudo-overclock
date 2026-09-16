/*
 * Asset resolution and optimization.
 *
 * A rehype transformer that visits every `<img>` node, resolves relative `src`
 * paths against the post's source directory, prepares the file into
 * `public/posts/<slug>/` (content-addressed and transcoded to AVIF/WebP), and
 * rewrites the node.
 *
 * Local raster images become `<picture>` elements wrapping an enriched `<img>`
 * that carries intrinsic `width`/`height` (reserved space — no layout shift),
 * `loading="lazy"`, `decoding="async"`, and a `data-slot="post-image"` hook.
 * SVG, animated, and undecodable assets stay plain `<img>` elements.
 *
 * External URLs (http, data:, /-rooted, #) are left untouched.
 */

import { mkdir } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";

import type { Element, Parent, Root } from "hast";
import { imageSizeFromFile } from "image-size/fromFile";
import { visit } from "unist-util-visit";

import { prepareImage, type PreparedImage } from "./image-optimizer.ts";

type ImageDimensions = {
  readonly width: number;
  readonly height: number;
};

/**
 * Reads intrinsic pixel dimensions from an image file's header.
 *
 * Returns `null` (and warns) when the file cannot be decoded. The caller then
 * emits the image without `width`/`height`, so a corrupt or unsupported asset
 * degrades gracefully instead of failing the build.
 */
const readImageDimensions = async (
  absolutePath: string,
): Promise<ImageDimensions | null> => {
  try {
    const { width, height } = await imageSizeFromFile(absolutePath);

    if (
      typeof width !== "number" ||
      typeof height !== "number" ||
      width <= 0 ||
      height <= 0
    ) {
      return null;
    }

    return { width, height };
  } catch {
    process.stderr.write(
      `[compile] could not read image dimensions: ${absolutePath}\n`,
    );
    return null;
  }
};

type AssetContext = {
  /** Absolute path to the post's source directory. */
  readonly postDir: string;
  /** Post slug — determines the public subdirectory. */
  readonly slug: string;
  /** Absolute path to the Next.js `public/` directory. */
  readonly publicDir: string;
};

const EXTERNAL_SRC_PATTERN = /^(?:https?:)?\/\/|^data:|^#|^\/|^mailto:/u;

const isExternal = (src: string): boolean => EXTERNAL_SRC_PATTERN.test(src);

const isLocalImage = (node: Element): boolean => {
  const { tagName, properties } = node;

  if (tagName !== "img" || properties === undefined) {
    return false;
  }

  const src = properties.src;

  return typeof src === "string" && !isExternal(src);
};

const publicUrl = (slug: string, fileName: string): string =>
  `/posts/${slug}/${fileName}`;

const createImageNode = (
  image: Element,
  slug: string,
  fileName: string,
  dimensions: ImageDimensions | null,
): Element => ({
  ...image,
  properties: {
    ...image.properties,
    src: publicUrl(slug, fileName),
    loading: "lazy",
    decoding: "async",
    "data-slot": "post-image",
    ...(dimensions === null
      ? {}
      : { width: dimensions.width, height: dimensions.height }),
  },
});

const createPictureNode = (
  image: Element,
  slug: string,
  prepared: Extract<PreparedImage, { kind: "picture" }>,
): Element => ({
  type: "element",
  tagName: "picture",
  properties: { "data-slot": "post-picture" },
  children: [
    ...prepared.sources.map(source => ({
      type: "element" as const,
      tagName: "source",
      properties: {
        type: source.type,
        srcset: publicUrl(slug, source.fileName),
      },
      children: [],
    })),
    createImageNode(image, slug, prepared.fallbackFileName, {
      width: prepared.width,
      height: prepared.height,
    }),
  ],
});

const processImage = async (
  node: Element,
  index: number,
  parent: Parent,
  context: AssetContext,
): Promise<void> => {
  const src = node.properties?.src;

  if (typeof src !== "string") return;

  const { postDir, slug, publicDir } = context;
  const absoluteSource = resolve(postDir, src);
  const targetDir = resolve(publicDir, "posts", slug);
  const baseName = basename(absoluteSource, extname(absoluteSource));

  await mkdir(targetDir, { recursive: true });

  const prepared = await prepareImage(absoluteSource, targetDir, baseName);

  if (prepared.kind === "picture") {
    parent.children[index] = createPictureNode(node, slug, prepared);
    return;
  }

  const dimensions = await readImageDimensions(absoluteSource);
  parent.children[index] = createImageNode(
    node,
    slug,
    prepared.fileName,
    dimensions,
  );
};

const rehypeAssets = (context: AssetContext) => {
  return async (tree: Root): Promise<void> => {
    const jobs: Promise<void>[] = [];

    visit(tree, "element", (node, index, parent) => {
      if (!isLocalImage(node) || index === undefined || parent === undefined) {
        return;
      }

      jobs.push(processImage(node, index, parent, context));
    });

    await Promise.all(jobs);
  };
};

export { rehypeAssets };
export type { AssetContext };
