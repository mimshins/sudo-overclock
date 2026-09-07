/*
 * Slug derivation.
 *
 * A post's slug comes from its frontmatter `slug` field if present, otherwise
 * from the source file's base name (folder name for a directory post).
 */

import { basename, extname } from "node:path";

const DEFAULT_SLUG = "untitled";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-+|-+$/gu, "");

/**
 * Derive a post slug from frontmatter or fall back to the markdown file's base
 * name.
 */
const deriveSlug = (filePath: string, frontmatterSlug?: string): string => {
  if (frontmatterSlug !== undefined && frontmatterSlug.trim() !== "") {
    return slugify(frontmatterSlug);
  }

  const base = basename(filePath, extname(filePath));
  const slug = slugify(base);

  return slug === "" ? DEFAULT_SLUG : slug;
};

export { deriveSlug, slugify };
