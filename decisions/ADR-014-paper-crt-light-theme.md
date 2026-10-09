# ADR-014 — Paper-CRT Light Theme

- **Status:** Accepted
- **Date:** 2026-10-09
- **Topic:** design
- **RFC:** [RFC-010](../rfcs/archived/RFC-010-paper-crt-light-theme.md)

## Context

The site shipped dark-only: the boot script pinned `data-theme="dark"`, and the
dormant light values failed contrast badly (phosphor on the light surface was
1.23:1). Dark overrides were duplicated in a `[data-theme]` block and a
`prefers-color-scheme` block, so the two could drift. `PhosphorField` read its
colors once, and its image mode painted each dot in the photo's own color — fine
on black, unusable on a light ground. The author wanted the paper-CRT theme back
and chose, in RFC-010 and a palette study, the green-bar ground and a faint ink
halo.

## Decision

- **Tokens.** Dark is the base `:root` and the no-JS default; one
  `:root[data-theme="light"]` block per layer holds the light values. No
  media-query copy: the boot script always sets the attribute. New primitives: a
  green-bar `paper` ramp (`--color-paper-50…900`) and two deeper phosphor steps
  (`--color-phosphor-950` `#006b45`, `-975`). On paper, `--color-phosphor`
  becomes the deep ink green so small phosphor text keeps 4.5:1; the accent for
  focus and borders is `phosphor-900`.
- **Glow.** A single-layer ink halo on paper (`--color-phosphor-glow` at 28%, no
  second layer); dark keeps the two-layer emission.
- **Code listings.** On paper, code blocks get green-bar bands — one ink-tint
  band every other line (`--color-code-band`, transparent on dark), sized with
  the `lh` unit and scrolling with the code.
- **Selection.** Inverse video in both themes through
  `--color-selection-background` / `--color-selection-foreground`.
- **Boot and toggle.** `src/app/theme.ts` builds the inline boot script (stored
  choice, else `prefers-color-scheme`, else dark) and the helpers the header's
  `ThemeToggle` uses (`[ light ]`, `aria-pressed`, remembered in `localStorage`,
  follows the OS until the reader chooses). The toggle reads the theme with
  `useSyncExternalStore` over the `data-theme` attribute.
- **Pointillism.** `PhosphorField` re-reads its colors when `data-theme`
  changes. A theme token `--phosphor-field-render` selects `emit` (dark: the
  photo's own colors) or `ink` (paper: every dot in the ink color, opacity from
  the source pixel's luminance); `--phosphor-field-ink-strength` sets the
  field's overall weight (1 on dark, 0.7 on paper). Under reduced motion the
  field now renders statically even in hover mode.
- **Guard.** `src/app/theme-contrast.test.ts` resolves every token chain of both
  themes from `globals.css` and checks WCAG ratios for text tiers, phosphor and
  status text, selection, focus, borders, filled-button text, and every
  code-highlight token. Dark `--color-border-primary` (2.2:1) is its only listed
  known deviation.

## Rationale

Making dark the base keeps the identity as the no-JS default and removes the
duplicated override blocks. Remapping `--color-phosphor` itself on paper (not
only the text tokens) was necessary because components use it for small text
such as the leader label. The theme-level render and strength tokens keep "which
theme is this" out of component code. The contrast test turns the theme's
accessibility from a one-time audit into a CI gate; it immediately found a
pre-existing dark bug (filled-neutral text invisible at 1:1) and code-highlight
diff colors under target in both themes, both fixed here.

## Consequences

- Every UI change is verified in both themes; the conformance checklist says so.
- New foreground/background roles get a pair in the contrast test.
- A first visit with a light OS preference now sees paper.
- Visitors without JavaScript always see dark.
