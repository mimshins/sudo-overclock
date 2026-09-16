# 000 — Display Typeface: undefined medium

- **Date:** 2026-09-16
- **Topic:** design / brand
- **RFC:**
  [`.ai/rfc/007-display-typeface.md`](../../rfc/007-display-typeface.md)

## Context

The visual identity (`docs/design-language.md`) had a single hard rule: one
typeface, JetBrains Mono, everywhere — including headings. The brand had no
distinct voice (the header was plain JetBrains Mono text) and the site shipped
no favicon. The author wanted a better, still **typed**, logo and a favicon
derived from it.

## Decision

Adopt **undefined medium** (a 5×7 pixel-grid monospace, SIL OFL-1.1) as a scoped
**display face**:

- Applied only to the brand wordmark and display headings (`h1`/`h2`). JetBrains
  Mono remains the **text face** for body, UI, code, metadata, and `h3`–`h6`.
- Self-hosted **unmodified** WOFF2 at `src/app/fonts/undefined-medium.woff2` via
  `next/font/local`, exposed as `--font-display`; license shipped at
  `public/fonts/undefined-medium/OFL.txt`.
- The wordmark is a typed lockup (`> sudo-overclock`); the standalone
  `soc-assembled-logo.svg` is the two-line lockup, and `src/app/icon.svg` is an
  `s`-monogram favicon on a 16-unit grid, rasterized to `src/app/apple-icon.png`
  by `pnpm brand:icons`.

## Rationale

The pixel face is stylistically native to the CRT/ASCII identity and gives the
brand a voice without touching reading comfort. Keeping it out of body copy and
`h3`+ avoids the pixel grid's costs (poor small-size legibility by conventional
standards, some double-spaced glyphs) where they would hurt most. Shipping the
font **unmodified** sidesteps OFL-1.1 §3 (Reserved Font Name "undefined medium")
— a subset would be a Modified Version and require renaming; the WOFF2 is only
~12 KB, so there is nothing to gain. Subsetting, italics, or extending the face
to `h3`+ are explicitly deferred and would need a new decision.

## Consequences

- `docs/design-language.md` Pillar 1 became "one text face, one display face";
  the Do/Don't list forbids a third face and any display face outside the brand
  and `h1`/`h2`.
- `h1`/`h2` sizes moved onto a 10px grid (`--typography-display-h1/h2/h3-*`)
  because the face's cell is 0.1em and must land on integer pixels; the
  `Heading` primitive now actually applies `font-size: var(--heading-size)` (it
  previously declared the size variable but never consumed it).
- Display text sets `letter-spacing: 0` and `-webkit-font-smoothing: none`.
- Watch for: keeping the font file byte-identical to upstream, and re-running
  `pnpm brand:icons` if `src/app/icon.svg` changes.
