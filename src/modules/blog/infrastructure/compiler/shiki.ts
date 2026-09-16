/*
 * Shiki syntax highlighting.
 *
 * The highlighter uses a CSS-variables theme so the emitted HTML references
 * `var(--shiki-*)` tokens. Those tokens are defined in `app/globals.css` and
 * derive from the active theme, so code blocks re-theme with zero runtime JS.
 *
 * The highlighter is created once and reused across every post, and grammars
 * are loaded lazily — only the languages a post actually fences are pulled in,
 * which keeps cold start and memory proportional to the content rather than to
 * the size of the supported-language list.
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

const SUPPORTED_LANGUAGES: ReadonlySet<string> = new Set(LANGUAGES);

type SupportedLanguage = (typeof LANGUAGES)[number];

const isSupportedLanguage = (language: string): language is SupportedLanguage =>
  SUPPORTED_LANGUAGES.has(language);

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
    langs: [],
  });

  return highlighterPromise;
};

/**
 * Loads the grammars for the given languages, skipping already-loaded and
 * unsupported ones. It only happens the first time a language is seen.
 */
const loadSupportedLanguages = async (
  highlighter: Highlighter,
  languages: Iterable<string>,
): Promise<void> => {
  const loaded = new Set(highlighter.getLoadedLanguages());
  const pending = [...new Set(languages)].filter(
    (language): language is SupportedLanguage =>
      !loaded.has(language) && isSupportedLanguage(language),
  );

  if (pending.length === 0) {
    return;
  }

  await highlighter.loadLanguage(...pending);
};

export {
  THEME_NAME,
  SHIKI_VARIABLE_PREFIX,
  getHighlighter,
  isSupportedLanguage,
  loadSupportedLanguages,
};
export type { Highlighter };
