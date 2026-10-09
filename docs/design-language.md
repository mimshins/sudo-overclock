# Design Language & Visual Identity

This site has two roles — **engineering blog** and **portfolio / about-me**. The
visual identity must serve both without compromise: legible enough to read for
twenty minutes straight, distinctive enough to be remembered after one visit.
The direction is a **CRT-phosphor, ASCII-chrome, monospace, cyberpunk**
aesthetic — the kind of screen a fictional 1980s hacker would stare at, but
rendered with modern browser technology.

This document is the identity — the _why_. The implementable system (tokens,
patterns, extension rules, conformance checklist) is
[`design-system.md`](./design-system.md). Where today's code differs from the
pillars below, `design-system.md` lists it under _Known deviations_ rather than
silently redefining the identity; identity decisions are ADRs
([ADR-007](../decisions/ADR-007-display-typeface.md),
[ADR-010](../decisions/ADR-010-design-system-foundations.md)).

## Pillars

1. **One text face, one display face.** JetBrains Mono is the **text face** —
   prose, UI, code, metadata, buttons, and `h3`–`h6`. **undefined medium** (a
   pixel-grid monospace) is the **display face**, used only for the brand
   wordmark and `h1`/`h2`. The pairing is deliberate and narrow: it gives the
   brand a distinctive pixel voice without changing how the prose reads. Never a
   third typeface, and never the display face outside those roles. Display
   headings carry weight through a pixel double-strike, the way bitmap fonts
   were emboldened on terminals — never synthetic bold.
2. **Mono palette with phosphor accent.** Background and foreground use neutral
   scale only. The single accent color is **phosphor green**
   (`--color-phosphor`, `#00ff9c`). Status roles (positive, negative, warn,
   info) have their own muted rust/amber/cyan hues, used only to signal status
   and always with a label or glyph — never as decoration, so the screen still
   reads as one phosphor-tinted display. Headings and code use brighter green;
   body uses neutral.
3. **Pixel-precise layout.** Body sizes are integer-line-height ratios. All
   spacing is a multiple of `var(--spacing)` (4 px). Borders are 1 px solid —
   never feathery. Box shadows are subtle phosphor glow, not soft drop shadows.
   Corners are square (`--radius-none`) or barely softened (`--radius-sm`); pill
   shapes (`--radius-full`) are reserved for tags and status chips.
4. **CRT phosphor glow.** The page title and other single points of emphasis
   emit a low-alpha, two-layer phosphor glow (the canonical recipe in
   [`design-system.md`](./design-system.md#elevation-and-glow)). Hero and error
   surfaces (the 404) may render a soft scanline overlay via
   `repeating-linear-gradient` — never behind long-form reading. Focus rings are
   double-layered: a 1 px solid phosphor ring with a faint outer glow.
   **Scanlines** are a CSS gradient overlay applied via a dedicated `.scanlines`
   utility — never an image. **Noise** is generated via inline SVG
   `<feTurbulence>` referenced through `background-image: url(...)`; no PNG/JPG
   assets. Noise strength is `--noise-strength` (0 = off, default 0.04) and
   respects `prefers-color-scheme`. **Glitch** is reserved for button hover
   feedback and hero/404/header moments, and is **subtle**: a single CSS
   keyframe (`@keyframes glitch`) that displaces the layer via `clip-path` for
   ~120 ms. No loops, no periodic flicker.
5. **ASCII chrome.** Section titles use leader syntax: `──── about.md ────` (the
   `Leader` primitive). Cards, callouts, and pre-formatted boxes use box-drawing
   borders. Buttons display ASCII affordances (e.g. `[ read more ]`). ASCII art
   is allowed in hero illustrations and 404 pages — encouraged, not avoided.
6. **Snap motion, no easing.** Hover/focus transitions are 80–150 ms with
   `ease-out` or no curve at all. No slow easing. No parallax. Animations feel
   like screen refreshes, not jelly. **All motion respects
   `prefers-reduced-motion: reduce`** — CSS animations and transitions are
   neutralized by an `@media` block in `globals.css`, and JS/canvas motion
   checks the media query itself. Static glow is not motion and stays.

## Component Conventions

- **Shared primitives live in `src/shared/ui/<kebab>.tsx`** with a co-located
  `<kebab>.module.css`. Module-scoped components live in
  `src/modules/<x>/presentation/`. App routes live in `src/app/`.
- Components reference **semantic tokens** (`--color-phosphor`,
  `--color-foreground`) in their CSS Modules. They never inline hex.
- Variant props (`variant="soft" | "ghost"`) map to CSS Module classes via a
  static lookup — never string interpolation.
- Button affordance text uses ASCII brackets: `[ read more ]`, `[ ok ]`.

## Theme System

Two themes, one identity. **Dark** is phosphor on near-black — the screen
glowing in a dark room, and the default. **Light** is paper-CRT — the same
terminal printed on green-bar listing paper: deep ink green instead of emitted
light, a faint ink halo instead of glow, and pointillism drawn as ink dots.
First visits follow the reader's OS; the header toggle, labeled with the theme
it switches to (`[ light ]` on dark, `[ dark ]` on paper), overrides and is
remembered. Token swapping happens in CSS only — no React state for theming
primitives. Details: [`design-system.md#theme`](./design-system.md#theme).

## Asset Notes

- **Imagery and illustration** — pixel art, pointillism (dotted), duo-color
  (phosphor ink on the dark ground), and abstract structure. The rules, file
  conventions, and checklist are in [`imagery.md`](./imagery.md). Icons are
  16×16 inline SVG on the pixel grid, single accent color. No emoji in chrome.
- **Display face** — undefined medium (SIL OFL-1.1), self-hosted unmodified at
  `src/app/fonts/undefined-medium.woff2` with its license at
  `public/fonts/undefined-medium/OFL.txt`. It is a pixel face (0.1em cell,
  single weight), so display text must use the 10px-grid sizes in `globals.css`,
  `letter-spacing: 0`, and `-webkit-font-smoothing: none`. Subsetting or
  modifying it would trigger the Reserved Font Name and is not allowed without a
  new decision (see [ADR-007](../decisions/ADR-007-display-typeface.md)).
- **Brand mark** — the wordmark is a typed lockup (`> sudo-overclock`), not an
  illustrated logo. The standalone `soc-assembled-logo.svg` is the two-line
  lockup; the favicon (`src/app/icon.svg`) is the `s` monogram plus a block
  cursor, on a 16-unit grid so it stays crisp at 16px.
- **Code blocks** use Shiki with a custom theme whose colors are derived from
  the active theme tokens (green-mono palette).

## Do / Don't

- ✅ Monospace everywhere. Integer-aligned spacing. Phosphor accents.
- ✅ ASCII chrome for section titles and callouts.
- ✅ Snap transitions; subtle phosphor glow on focus.
- ❌ Don't introduce a third typeface, or use the display face outside the brand
  wordmark and `h1`/`h2`.
- ❌ Don't use anti-aliased drop shadows — phosphor glow only.
- ❌ Don't add new colors without a semantic token reason.
- ❌ Don't use emoji in UI chrome.
