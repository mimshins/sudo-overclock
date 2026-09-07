/*
 * Asset resolution and copying.
 *
 * A rehype transformer that visits every `<img>` node, resolves relative
 * `src` paths against the post's source directory, copies the file into
 * `public/posts/<slug>/`, and rewrites the `src` to its public URL.
 *
 * External URLs (http, data:, /-rooted, #) are left untouched.
 */

import { copyFile, mkdir } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

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

const findImages = (tree: Root): Element[] => {
  const images: Element[] = [];

  visit(tree, "element", node => {
    if (!isLocalImage(node)) return;

    images.push(node);
  });

  return images;
};

const copyImage = async (
  image: Element,
  context: AssetContext,
): Promise<void> => {
  const { postDir, slug, publicDir } = context;
  const src = image.properties?.src;

  if (typeof src !== "string") return;

  const absoluteSource = resolve(postDir, src);
  const fileName = basename(absoluteSource);
  const absoluteTarget = resolve(publicDir, "posts", slug, fileName);

  await mkdir(dirname(absoluteTarget), { recursive: true });
  await copyFile(absoluteSource, absoluteTarget);

  image.properties = { ...image.properties, src: `/posts/${slug}/${fileName}` };
};

const rehypeAssets = (context: AssetContext) => {
  return async (tree: Root): Promise<void> => {
    const images = findImages(tree);
    await Promise.all(images.map(image => copyImage(image, context)));
  };
};

export { rehypeAssets };
export type { AssetContext };
