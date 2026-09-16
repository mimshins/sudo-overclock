# 007 — Display Typeface: undefined medium for Wordmark & Display Headings

- **Status:** Implemented
- **Date:** 2026-09-16
- **Supersedes:** —
- **Superseded by:** —

## Context

`docs/design-language.md` establishes a deliberate constraint: **one typeface,
one rhythm** — JetBrains Mono for prose, UI, headings, and chrome, with an
explicit rule never to introduce a second typeface. That constraint has served
the "CRT-phosphor terminal" identity well and should remain the default for the
reading experience: body copy is read for long stretches and needs a workhorse
mono.

Two gaps have emerged:

1. **The brand has no distinct visual voice.** The header brand is plain text
   (`site-header.tsx`, `sudo-overclock` in JetBrains Mono) and the home hero
   title is the same face at `h1`. The only piece of brand art,
   `soc-assembled-logo.svg`, is a blocky pixel wordmark used solely in the
   README. Nothing visually separates "the brand" from "the UI".
2. **There is no favicon.** `src/app/` ships no `icon`/`apple-icon`/`favicon`
   metadata files, so browsers fall back to a blank/document icon.

The author wants to improve the logo — which is, and should remain, a **typed
wordmark** (not an illustrated mark) — and to give the site a favicon derived
from it.

The obvious candidate is [undefined medium](https://undefined-medium.com)
([andirueckel/undefined-medium](https://github.com/andirueckel/undefined-medium)),
a free/open pixel-grid monospace typeface: 500+ glyphs, 5×7 grid lineage
(MonteCarlo), shipped in WOFF/WOFF2 for the web, licensed **SIL OFL-1.1**. It is
stylistically aligned with the CRT/pixel identity and is a pixel-for-pixel
natural companion to an ASCII chrome aesthetic.

Two properties of the font shape the decision:

- It declares a **Reserved Font Name** ("undefined medium"). Under OFL-1.1 §3 a
  _modified_ version (including a subset) may not keep that name; an unmodified
  copy may be redistributed freely provided the copyright + license travel with
  it. The shipped WOFF2 is only **12,136 bytes**, so subsetting buys little and
  would force a rename — self-hosting the unmodified file is both simpler and
  license-clean.
- It is a **pixel font**, so it must be rendered at integer-pixel sizes with
  font smoothing disabled to stay crisp; the global
  `-webkit-font-smoothing: antialiased` is actively harmful to it.
- It contains some **double-spaced glyphs** (per the upstream README), so
  arbitrary prose in this face can collide. This reinforces keeping it off body
  text.

## Options

### Option A — undefined medium for the wordmark and display headings only

- **Pros:** Gives the brand a distinct voice without touching the reading
  experience. Body, UI chrome, code, and metadata all stay JetBrains Mono, so
  Pillar 1 becomes "one text face + one display face" rather than "no second
  face". Small asset (12 KB, self-hosted), no third-party request. License-clean
  by shipping the file unmodified with `OFL.txt`.
- **Cons:** Adds one self-hosted font and a token. Two faces to reason about in
  reviews. Pixel rendering needs care (integer sizes, smoothing off). Headings
  containing double-spaced glyphs need verification.

### Option B — undefined medium everywhere (replace JetBrains Mono)

- **Pros:** Maximum stylistic commitment; one face again.
- **Cons:** A 5×7 pixel grid is hostile to 20-minute body reading and to code.
  Rejected outright.

### Option C — Keep JetBrains Mono; express the brand only through SVG art

- **Pros:** Zero new dependency; fully preserves Pillar 1.
- **Cons:** The author explicitly wants the logo to stay _typed_; an illustrated
  mark is out of scope. The plain header wordmark stays undifferentiated.

### Option D — Introduce a non-pixel display face (humanist/serif contrast)

- **Pros:** Higher legibility at large sizes; classic editorial pairing.
- **Cons:** Breaks the pixel/CRT metaphor and is a much larger aesthetic shift
  than the author asked for.

## Decision

Adopt **Option A**.

1. **One new typeface, scoped by role.** `undefined medium` is the **display
   face** and is applied only to the brand wordmark and top-level display
   headings (`h1`/`h2`). JetBrains Mono remains the **text face** for body, UI,
   code, metadata, and all lower heading levels.
2. **Self-host the unmodified WOFF2.** Load via `next/font/local` (already a
   build-time, self-hosted path compatible with `output: "export"`), ship
   `OFL.txt` alongside, and keep the font's name unchanged.
3. **Expose it as a semantic token**, not an ad-hoc family string:
   `--font-display` in `globals.css`, applied by the shared `Heading` primitive
   and the specific CSS Modules that render display text.
4. **Favicon derived from the wordmark**, served via Next metadata files
   (`src/app/icon.svg` + a raster `apple-icon`), pixel-crisp and theme-aware.
5. **Update the logo asset** (`soc-assembled-logo.svg`) to the same wordmark
   treatment so the README art and the on-site brand agree.

The "never introduce a second typeface" rule is amended to the narrower, still
strong rule: **never introduce a second _text_ typeface; only the designated
display face may be used, and only for the brand and display headings.**

## Consequences

- Brand and display headings gain a distinctive pixel voice; body reading and
  code rendering are unaffected.
- `docs/design-language.md` Pillar 1 and the Do/Don't list must be rewritten; a
  memory entry records the decision.
- New obligations: keep the font file unmodified (else rename it), keep
  `OFL.txt` shipped, and render display text at integer sizes with smoothing
  disabled.
- A future `h3+` switch, an italic/weight variant, or subsetting would need a
  fresh decision (subset ⇒ rename).
- Superseded-by relation: this RFC narrows, and does not delete, Pillar 1.
- Recorded in
  [`.ai/memory/design/000-display-typeface.md`](../memory/design/000-display-typeface.md).
