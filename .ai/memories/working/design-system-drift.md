---
description:
  Code that violates docs/design-system.md, found by the 2026-10-09 design
  audit. Work list for fixing it; promote fixes into docs and delete entries as
  they land.
status: active
related: docs/design-system.md#known-deviations
created: 2026-10-09
---

# Design-system drift

## Context

A read-only audit of `globals.css`, every CSS Module, and the UI components
(2026-10-09, commit 228d806) compared the code to `docs/design-language.md`,
`docs/components.md`, and `docs/architecture.md`. The doc-side contradictions
were fixed or listed as open decisions in `docs/design-system.md`; the code-side
issues below remain.

## Findings (code fixes, smallest first)

Anchored to symbols and selectors, not line numbers; verified against the code
on 2026-10-09.

- **Contrast (dark only):** `--color-foreground-muted` /
  `--color-border-primary` are 2.2:1 (the theme contrast test lists the border
  as a known deviation); muted text is used by `.count` in `tags.module.css` and
  by `Caption variant="muted"`.
- **`data-slot` missing:** `PostHeader` title `<h1>` and description `<p>`
  (`post-header.tsx`); `PostList` card internals; `SiteHeader` and `SiteFooter`
  internals; route page wrappers (`src/app/**/page.tsx`); `CoverImage`.
- **State classes declaring properties:** `.link:hover` / `.active` in
  `site-header.module.css` and `table-of-contents.module.css`; the copied state
  in `code-copy.module.css`; card hover in `post-list.module.css`.
- **Duplication → primitives:** the glow recipe in `post-header.module.css`
  (`.title`) and `post-body.module.css` (`h1`) instead of `Heading glow` /
  `.phosphor-glow`; code font size/leading duplicated between
  `code-block.module.css` (`.pre`) and `post-body.module.css` (`pre`).
- **Missing tokens:** letter-spacing, generic font weights, border widths, a
  glass-panel recipe (removes the `color-mix` exemptions in
  `stylelint.config.mjs`). Adding them unlocks stylelint length rules.
- **Layout:** `tags.module.css` / `tag.module.css` lack the ≤640px
  `padding-inline` rule; prose has no measure cap (`--container-prose` unused).

## Review follow-ups (nits from the 2026-10-09 review)

- Image store: orphaned `<hash>.<uuid>.tmp` files are only pruned when their
  whole entry is stale (`entryKey` groups them with the sidecar); two concurrent
  compiles can make one prune remove a file the other just saved (only a later
  miss).
- CI: the image-store cache key hashes all of `content/raw/**`; key it on image
  files + the `sharp` version instead.
- `Leader`: `{...rest}` after `data-slot` lets callers override the slot; the
  Patterns table says "lowercase label" while the CSS uppercases it.
- Docs: RFC-004 does not link back to ADR-004 and cites gitignored `.ai/specs/`;
  RFC-001 and RFC-008 phrase the supersession differently; ADR-008 §4 describes
  the pre-wireit hook (superseded by ADR-011); `design-system.md` variant
  example uses names that differ from `tag.module.css`; `.changeset/README.md`
  suggests empty changesets for docs/CI that need none; the README tech stack
  omits wireit, stylelint, and changesets; `oxfmt.config.ts` exempts the
  agent/skill files without saying why (single-line frontmatter for tool
  compatibility).

## Open questions

Resolved by ADR-010 (2026-10-09): 16px root, `Leader` primitive, 404 with
scanlines/glitch, status hues, stylelint (colors + durations), the image-sheen
duration token. The light theme shipped with ADR-014.

## To promote on resolution

Each fix updates `docs/design-system.md` (remove it from Known deviations) and
`docs/components.md`; identity decisions become ADRs.
