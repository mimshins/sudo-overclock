/*
 * Compiler orchestration.
 *
 * Walks `content/raw/**`, compiles each markdown file, copies referenced
 * assets into `public/posts/<slug>/`, and writes a single generated TypeScript
 * module to `content/compiled/index.ts` exporting every post.
 *
 * When `imageCacheDir` is set, prepared images are kept in a persistent
 * content-addressed store there, so unchanged images are copied rather than
 * re-encoded; the store is pruned once the compile finishes.
 */

import { glob, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";

import { parseFrontmatter } from "../frontmatter.ts";
import { withPipelineSlot } from "./concurrency.ts";
import {
  createImageOptimizer,
  type PrepareImageOptions,
} from "./image-optimizer.ts";
import { createMarkdownCompiler } from "./pipeline.ts";
import { estimateReadingTimeMinutes } from "./reading-time.ts";
import { getHighlighter, type Highlighter } from "./shiki.ts";
import { deriveSlug } from "./slug.ts";
import type { RawFrontmatter, CompiledPost, TocItem } from "./types.ts";

type CompileOptions = {
  /** Absolute path to `modules/blog/content/raw/`. */
  readonly rawDir: string;
  /** Absolute path to `modules/blog/content/compiled/`. */
  readonly compiledDir: string;
  /** Absolute path to the Next.js `public/` directory. */
  readonly publicDir: string;
  /**
   * Absolute path to the persistent image store root. `null` or absent disables
   * the store and every image is encoded on every run.
   */
  readonly imageCacheDir?: string | null;
  /** Image encoder; defaults to sharp. */
  readonly imageEncoder?: PrepareImageOptions["encoder"];
};

const COMPILED_FILE_NAME = "index.ts";

const GENERATED_HEADER = `/*
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by the blog content compiler from \`content/raw/**\`. Run
 * \`pnpm compile\` to regenerate.
 */
`;

const findMarkdownFiles = async (rawDir: string): Promise<string[]> =>
  (await Array.fromAsync(glob("**/*.md", { cwd: rawDir }))).toSorted();

const text = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const textList = (value: unknown): RawFrontmatter["tags"] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : text(value);

const readRawFrontmatter = (
  source: string,
): { readonly data: RawFrontmatter; readonly content: string } => {
  const { data, content } = parseFrontmatter(source);

  return {
    data: {
      title: text(data["title"]),
      date: text(data["date"]),
      slug: text(data["slug"]),
      description: text(data["description"]),
      tags: textList(data["tags"]),
      author: text(data["author"]),
    },
    content,
  };
};

const normalizeTags = (tags: RawFrontmatter["tags"]): readonly string[] => {
  if (tags === undefined) {
    return [];
  }
  const list = typeof tags === "string" ? [tags] : tags;
  return list.map(tag => tag.trim()).filter(tag => tag !== "");
};

const buildCompiledPost = ({
  filePath,
  slug,
  title,
  date,
  description,
  tags,
  author,
  body,
  readingTimeMinutes,
  toc,
}: {
  readonly filePath: string;
  readonly slug: string;
  readonly title: string;
  readonly date: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly author: string | undefined;
  readonly body: string;
  readonly readingTimeMinutes: number;
  readonly toc: readonly TocItem[];
}): CompiledPost => {
  const id = filePath.replace(/\.md$/u, "");

  return {
    id,
    slug,
    title,
    date,
    description,
    tags,
    ...(author === undefined ? {} : { author }),
    body,
    readingTimeMinutes,
    toc,
  };
};

const compileOnePost = async ({
  filePath,
  rawDir,
  publicDir,
  highlighter,
  images,
}: {
  readonly filePath: string;
  readonly rawDir: string;
  readonly publicDir: string;
  readonly highlighter: Highlighter;
  readonly images: PrepareImageOptions;
}): Promise<CompiledPost> => {
  const absolutePath = resolve(rawDir, filePath);
  const source = await readFile(absolutePath, "utf8");
  const { data, content } = readRawFrontmatter(source);

  const slug = deriveSlug(filePath, data.slug);
  const title = data.title?.trim() ?? basename(filePath, extname(filePath));
  const date = data.date?.trim() ?? "";
  const description = data.description?.trim() ?? "";
  const tags = normalizeTags(data.tags);
  const readingTimeMinutes = estimateReadingTimeMinutes(content);

  const compile = createMarkdownCompiler({
    highlighter,
    assets: {
      postDir: dirname(absolutePath),
      slug,
      publicDir,
      images,
    },
    stripTitleHeading: true,
  });
  const { html, toc } = await compile(content);

  return buildCompiledPost({
    filePath,
    slug,
    title,
    date,
    description,
    tags,
    author: data.author?.trim(),
    body: html,
    readingTimeMinutes,
    toc,
  });
};

const renderCompiledModule = (posts: readonly CompiledPost[]): string => {
  const serialized = JSON.stringify(posts, null, 2);
  return `${GENERATED_HEADER}import type { CompiledPost } from "../../infrastructure/compiler/types.ts";

export const compiledPosts: readonly CompiledPost[] = ${serialized};

export default compiledPosts;
`;
};

const compileAll = async (
  options: CompileOptions,
): Promise<readonly CompiledPost[]> => {
  const { rawDir, compiledDir, publicDir } = options;
  const imageOptimizer = createImageOptimizer({
    cacheDir: options.imageCacheDir ?? null,
    ...(options.imageEncoder === undefined
      ? {}
      : { encoder: options.imageEncoder }),
  });

  const highlighter = await getHighlighter();
  const markdownFiles = await findMarkdownFiles(rawDir);

  // Clear stale output before compiling: asset copies accumulate in
  // `public/posts/`, and the compiled module is rewritten wholesale.
  await rm(resolve(publicDir, "posts"), { recursive: true, force: true });

  const compiledPosts = await Promise.all(
    markdownFiles.map(filePath =>
      withPipelineSlot(() =>
        compileOnePost({
          filePath,
          rawDir,
          publicDir,
          highlighter,
          images: imageOptimizer.options,
        }),
      ),
    ),
  );

  await rm(compiledDir, { recursive: true, force: true });
  await mkdir(compiledDir, { recursive: true });
  await writeFile(
    join(compiledDir, COMPILED_FILE_NAME),
    renderCompiledModule(compiledPosts),
    "utf8",
  );

  await imageOptimizer.prune();

  return compiledPosts;
};

export { compileAll };
export type { CompileOptions };
