# ADR-016 — Design Drift Cleanup: Type, Border, and Size Tokens; Self-Hosted Text Face

- **Status:** Accepted
- **Date:** 2026-10-09
- **Topic:** design
- **RFC:** waived by the author, who chose the contrast fix and font loading
  directly (options below). Closes the code-side findings of the 2026-10-09
  design audit.

## Context

The 2026-10-09 audit found code that broke `docs/design-system.md`: raw
`letter-spacing`, `font-weight`, border widths, code type values, and fixed
cover sizes in CSS Modules (no tokens existed, so stylelint could not forbid
them); state classes that set properties instead of overriding local custom
properties; HTML layers without `data-slot`; shared primitives that let a
caller's `data-slot` replace theirs; the post title re-implementing `Heading`;
muted text at 2.2:1 carrying information (tag counts); and JetBrains Mono loaded
from the Google Fonts CDN beside a never-loaded `Vazirmatn` in the RTL stack.

## Decision

- **Tokens.** New primitives in `globals.css`: weights
  (`--typography-weight-regular` … `-bold`, which the per-role `-weight` tokens
  now reference), tracking (`--typography-tracking-tight` … `-widest`), code
  type (`--typography-code-size`, `-code-leading`, `-code-inline-size`), glyph
  leading (`--typography-glyph-leading`), border widths (`--border-width-thin`,
  `-thick`), and sizes (`--size-control`, `--size-cover-md`, `-sm`; covers keep
  2:3 with `aspect-ratio`).
- **Enforcement.** stylelint's `declaration-property-value-allowed-list` rejects
  raw `letter-spacing`, `font-weight`, and border widths (including local custom
  properties named for them) outside `globals.css`.
- **States.** Header links, brand, and menu button, TOC links, and post cards
  override local custom properties in their state classes.
- **Slots.** Every HTML layer that takes a class has a `data-slot`; shared
  primitives spread `rest` before their own `data-slot`, and a test checks that
  a caller cannot replace it. `PostHeader` renders its title through
  `Heading as="h1" size="h1" glow`.
- **Muted text.** Tag counts use tertiary ink; `Caption` loses its unused
  `muted` variant. `--color-foreground-muted` stays decorative-only.
- **Text face.** JetBrains Mono (variable, with italics) loads through
  `next/font/google`, which downloads it at build time and serves it from the
  site's origin. `Vazirmatn` leaves the RTL stack.

## Options considered

| Question     | Chosen                                    | Also considered                                 |
| ------------ | ----------------------------------------- | ----------------------------------------------- |
| Muted text   | move information-bearing uses to tertiary | raise `--color-foreground-muted` to 4.5:1       |
| Font hosting | `next/font/google` (build-time download)  | committed woff2 via `next/font/local`; keep CDN |

## Rationale

Tokens make the scales explicit and let the linter hold them, which is the only
way the rules stay true as the site grows. Raising the muted token would have
put it on top of tertiary and erased the tier. Self-hosting removes a
third-party request (privacy, one less origin before first paint) without a new
dependency, and `next/font` adds size-adjusted fallbacks.

## Consequences

- Remaining raw values are drawn chrome (the burger icon, glow radii, glitch
  offsets) and prose headings styled from compiler HTML; both are listed under
  _Known deviations_ in `docs/design-system.md`.
- `pnpm build` needs network access to download the font, as CI already has.
