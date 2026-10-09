---
description:
  Naming, imports, styling, and comment conventions. Read before writing any
  code or CSS.
last-verified: 2026-10-09
---

# Conventions

The rules are in [`AGENTS.md`](../../AGENTS.md#non-negotiables) and
[`docs/architecture.md`](../../docs/architecture.md#naming). The practical
reminders:

- Files kebab-case, component identifiers PascalCase; a component is
  `<name>.tsx` + co-located `<name>.module.css`; no barrel files.
- Styling: CSS Modules referencing semantic tokens from `src/app/globals.css`;
  raw values exist only there. Variants override local custom properties.
- Every `className`-bearing layer has `data-slot="<name>"`.
- ASCII affordances (`[ read more ]`); no emoji in UI chrome.
- Comments: only file headers in scripts/infrastructure and short constraint
  comments — the rule is `docs/architecture.md#comments`.
- Tests: `node:test` via `tsx --test`, `*.test.ts` beside the code.
- Commits (only when asked): Conventional Commits, imperative, ≤ 72 chars.
