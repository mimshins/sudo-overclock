import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 80,
  insertFinalNewline: true,
  jsdoc: true,
  proseWrap: "always",
  semi: true,
  singleQuote: false,
  jsxSingleQuote: false,
  arrowParens: "avoid",
  trailingComma: "all",
  tabWidth: 2,
  bracketSpacing: true,
  bracketSameLine: false,
  endOfLine: "lf",
  htmlWhitespaceSensitivity: "css",
  singleAttributePerLine: true,
  sortImports: true,
  sortPackageJson: false,
  ignorePatterns: [
    ".changeset/**/*.md",
    "**/CHANGELOG.md",
    "**/dist",
    "**/node_modules",
    "pnpm-lock.*",
    "LICENSE",
    // Agent and skill files keep single-line frontmatter descriptions, which
    // some agent tools require; oxfmt would wrap them.
    ".ai/agents/*.md",
    ".ai/skills/*/SKILL.md",
  ],
});
