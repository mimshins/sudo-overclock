/*
 * Compiler input/output types.
 *
 * These live in `infrastructure/compiler/` (not `domain/`) because they describe
 * the compiler's contract with the filesystem, not the domain's model of a
 * post. The compiled output is mapped to the domain `Post`/`PostSummary` types
 * by the content repository adapter.
 */

type RawFrontmatter = {
  readonly title?: string;
  readonly date?: string;
  readonly slug?: string;
  readonly description?: string;
  readonly tags?: string | readonly string[];
  readonly author?: string;
};

/**
 * A single table-of-contents entry, one per heading in a post.
 *
 * `depth` is 1–6 (mirroring `h1`–`h6`); `id` is the heading's anchor and is
 * unique within the page.
 */
type TocItem = {
  readonly id: string;
  readonly text: string;
  readonly depth: number;
};

/**
 * A single compiled post, ready to be written to `content/compiled/`.
 *
 * `body` is rendered HTML (headings, paragraphs, highlighted code, images with
 * public URLs). `readingTimeMinutes` is computed from the source markdown.
 * `toc` lists every heading anchor in document order.
 */
type CompiledPost = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly date: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly author?: string;
  readonly body: string;
  readonly readingTimeMinutes: number;
  readonly toc: readonly TocItem[];
};

export type { RawFrontmatter, TocItem, CompiledPost };
