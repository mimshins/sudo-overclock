/*
 * Heading anchor + table-of-contents generation.
 *
 * A rehype transformer that visits every heading (`h1`–`h6`), assigns a unique
 * slug-derived `id`, and records a table-of-contents entry (`id`, `text`,
 * `depth`) into a caller-provided array.
 *
 * Slug generation reuses the compiler's `slugify` so heading anchors stay
 * consistent with post slugs. Duplicate headings get a numeric suffix to keep
 * every `id` unique within the page.
 */

import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

import { slugify } from "./slug.ts";
import type { TocItem } from "./types.ts";

const HEADING_DEPTH: Readonly<Record<string, number>> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
};

const headingDepth = (tagName: string): number | undefined =>
  HEADING_DEPTH[tagName];

const extractText = (node: Element): string => {
  let text = "";

  visit(node, "text", child => {
    text += child.value;
  });

  return text.trim();
};

const uniqueId = (slug: string, used: ReadonlySet<string>): string => {
  let candidate = slug;
  let counter = 1;

  while (used.has(candidate)) {
    candidate = `${slug}-${counter}`;
    counter += 1;
  }

  return candidate;
};

const rehypeHeadings = (toc: TocItem[]) => {
  const used = new Set<string>();

  return (tree: Root): void => {
    visit(tree, "element", node => {
      const depth = headingDepth(node.tagName);

      if (depth === undefined) return;

      const text = extractText(node);
      const slug = slugify(text);
      const id = uniqueId(slug === "" ? "section" : slug, used);

      used.add(id);

      node.properties = { ...node.properties, id };
      toc.push({ id, text, depth });
    });
  };
};

export { rehypeHeadings };
