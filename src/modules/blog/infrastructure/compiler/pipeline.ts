/*
 * The markdown → HTML pipeline.
 *
 * remark-parse → remark-gfm → remark-rehype → Shiki highlight → asset copy →
 * rehype-stringify.
 *
 * The pipeline is async because Shiki's highlighter is created once and reused
 * across every post.
 */

import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { rehypeAssets, type AssetContext } from "./assets.ts";
import { rehypeHeadings } from "./headings.ts";
import { THEME_NAME, type Highlighter } from "./shiki.ts";
import type { TocItem } from "./types.ts";

/** Fenced block aliases → canonical Shiki language id. */
const LANG_ALIASES: Readonly<Record<string, string>> = {
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  py: "python",
  rb: "ruby",
  rs: "rust",
  go: "go",
  html: "html",
  css: "css",
  json: "json",
  yml: "yaml",
  md: "markdown",
  dockerfile: "docker",
};

type CompileMarkdownOptions = {
  readonly highlighter: Highlighter;
  readonly assets: AssetContext;
};

type CompileResult = {
  readonly html: string;
  readonly toc: readonly TocItem[];
};

const createMarkdownCompiler = (options: CompileMarkdownOptions) => {
  const { highlighter, assets } = options;

  return async (markdown: string): Promise<CompileResult> => {
    const toc: TocItem[] = [];

    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: false })
      .use(rehypeShikiFromHighlighter, highlighter, {
        theme: THEME_NAME,
        langAlias: LANG_ALIASES,
      })
      .use(rehypeAssets, assets)
      .use(rehypeHeadings, toc)
      .use(rehypeStringify)
      .process(markdown);

    return { html: String(file), toc };
  };
};

export { createMarkdownCompiler };
export type { CompileMarkdownOptions, CompileResult };
