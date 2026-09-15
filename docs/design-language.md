# Design Language & Visual Identity

This site has two roles — **engineering blog** and **portfolio / about-me**. The
visual identity must serve both without compromise: legible enough to read for
twenty minutes straight, distinctive enough to be remembered after one visit.
The direction is a **CRT-phosphor, ASCII-chrome, monospace, cyberpunk**
aesthetic — the kind of screen a fictional 1980s hacker would stare at, but
rendered with modern browser technology.

## Pillars

1. **One typeface, one rhythm.** JetBrains Mono everywhere — prose, UI,
   headings, buttons. No pairing. Single family keeps the page feeling cohesive
   and intensifies the terminal aesthetic.
2. **Mono palette with phosphor accent.** Background and foreground use neutral
   scale only. The single accent color is **phosphor green**
   (`--color-phosphor`, `#00ff9c`). Brand/positive/negative/warn/info roles map
   to neutrals + opacity so the screen reads as one phosphor-tinted display.
   Headings and code use brighter green; body uses neutral.
3. **Pixel-precise layout.** Body sizes are integer-line-height ratios. All
   spacing is a multiple of `var(--spacing)` (4 px). Borders are 1 px solid —
   never feathery. Box shadows are subtle phosphor glow, not soft drop shadows.
   Rounded radii are small (`--radius-sm`/`--radius-md`); pill shapes reserved
   for status chips.
4. **CRT phosphor glow.** Headings emit a low-alpha green glow
   (`text-shadow: 0 0 6px var(--color-phosphor-glow)`). Hero areas and large
   quotes optionally render a soft scanline overlay via
   `repeating-linear-gradient`. Focus rings are double-layered: a 1 px solid
   phosphor ring with a faint outer glow. **Scanlines** are a CSS gradient
   overlay applied via a dedicated `.scanlines` utility — never an image.
   **Noise** is generated via inline SVG `<feTurbulence>` referenced through
   `background-image: url(...)`; no PNG/JPG assets. Noise strength is
   `--noise-strength` (0 = off, default 0.04) and respects
   `prefers-color-scheme`. **Glitch** is reserved for hero/404/headers only and
   is **subtle**: a single CSS keyframe (`@keyframes glitch`) that displaces the
   layer via `clip-path` for ~120 ms. No loops, no periodic flicker.
5. **ASCII chrome.** Section titles use leader syntax: `── about.md ──`. Cards,
   callouts, and pre-formatted boxes use box-drawing borders. Buttons display
   ASCII affordances (e.g. `[ read more ]`). ASCII art is allowed in hero
   illustrations and 404 pages — encouraged, not avoided.
6. **Snap motion, no easing.** Hover/focus transitions are 80–150 ms with
   `ease-out` or no curve at all. No slow easing. No parallax. Animations feel
   like screen refreshes, not jelly. **All motion respects
   `prefers-reduced-motion: reduce`** — phosphor glow, scanline drift, and
   glitch are killed by an `@media` block in `globals.css`.

## Component Conventions

- **Shared primitives live in `src/shared/ui/<kebab>.tsx`** with a co-located
  `<kebab>.module.css`. Module-scoped components live in
  `src/modules/<x>/presentation/`. App routes live in `src/app/`.
- Components reference **semantic tokens** (`--color-phosphor`,
  `--color-foreground`) in their CSS Modules. They never inline hex.
- Variant props (`variant="primary" | "ghost"`) map to CSS Module classes via a
  static lookup — never string interpolation.
- Button affordance text uses ASCII brackets: `[ read more ]`, `[ ok ]`.

## Theme System

Two themes — `light` (paper-CRT, dark grey on cream) and `dark` (default,
phosphor on near-black). Switching is controlled by the `data-theme` attribute
on `<html>`; an inline boot script reads `localStorage.theme` or
`prefers-color-scheme` before paint to avoid flash. Token swapping happens in
CSS only — no React state for theming primitives.

## Asset Notes

- **Icons** drawn as 16×16 px inline SVG using 1 px strokes, single accent
  color. No emoji in chrome.
- **Decorative pixel art** allowed in hero / 404 / post headers, drawn inline as
  `<svg>` with `shape-rendering: pixelated`.
- **Code blocks** use Shiki with a custom theme whose colors are derived from
  the active theme tokens (green-mono palette).

## Do / Don't

- ✅ Monospace everywhere. Integer-aligned spacing. Phosphor accents.
- ✅ ASCII chrome for section titles and callouts.
- ✅ Snap transitions; subtle phosphor glow on focus.
- ❌ Don't introduce a second typeface, ever.
- ❌ Don't use anti-aliased drop shadows — phosphor glow only.
- ❌ Don't add new colors without a semantic token reason.
- ❌ Don't use emoji in UI chrome.
