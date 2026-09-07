/*
 * Shiki syntax highlighting.
 *
 * The highlighter uses a CSS-variables theme so the emitted HTML references
 * `var(--shiki-*)` tokens. Those tokens are defined in `app/globals.css` and
 * derive from the active theme, so code blocks re-theme with zero runtime JS.
 *
 * The highlighter is created once and reused across every post.
 */

import {
  createCssVariablesTheme,
  createHighlighter,
  type Highlighter,
} from "shiki";

const THEME_NAME = "phosphor-mono";

const SHIKI_VARIABLE_PREFIX = "--shiki-";

/**
 * Languages the highlighter can handle. Add a language here to support it in
 * fenced code blocks. Common short aliases are mapped via `langAlias` in the
 * pipeline.
 */
const LANGUAGES = [
  "javascript",
  "jsx",
  "typescript",
  "tsx",
  "json",
  "yaml",
  "markdown",
  "bash",
  "shell",
  "html",
  "css",
  "python",
  "go",
  "rust",
  "c",
  "cpp",
  "java",
  "sql",
  "docker",
  "diff",
  "toml",
  "xml",
] as const;

const theme = createCssVariablesTheme({
  name: THEME_NAME,
  variablePrefix: SHIKI_VARIABLE_PREFIX,
  variableDefaults: {},
  fontStyle: true,
});

let highlighterPromise: Promise<Highlighter> | undefined;

const getHighlighter = (): Promise<Highlighter> => {
  highlighterPromise ??= createHighlighter({
    themes: [theme],
    langs: [...LANGUAGES],
  });

  return highlighterPromise;
};

export { THEME_NAME, SHIKI_VARIABLE_PREFIX, getHighlighter };
export type { Highlighter };
