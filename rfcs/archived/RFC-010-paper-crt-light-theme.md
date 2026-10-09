# RFC-010 — Paper-CRT Light Theme

- **Status:** Implemented
- **Date:** 2026-10-09
- **Supersedes:** —
- **Superseded by:** —

## Context

The design language once described two themes — `light` (paper-CRT, dark grey on
cream) and `dark` (phosphor on near-black). Today the site is dark-only: the
boot script in `src/app/layout.tsx` pins `data-theme="dark"`, and the light
values in `src/app/globals.css` are dormant. They are not usable as they stand:

- `--color-phosphor-500` on the light surface (`#f6f6f6`) is **1.23:1**; the
  accent, links, and glow are illegible.
- Dark overrides are written twice (`[data-theme="dark"]` and a
  `prefers-color-scheme` block); there is no `[data-theme="light"]` selector.
- `PhosphorField` reads its colors once from computed styles and does not follow
  a theme change; background sources (`public/*/bg.jpg`) are graded for a dark
  ground.
- Shiki tokens, glow, scanline/noise strengths, shadows, and imagery
  (`docs/imagery.md`, duo-color on a dark ground) all assume dark.

The author wants the paper-CRT light theme back.

## Options

### Option A — Paper-CRT light theme with a toggle

A real light palette (cream "paper" ground, ink-dark neutrals, a phosphor ramp
re-tuned for contrast on light), an ASCII toggle in the header (`[ light ]` /
`[ dark ]`), first-visit default from `prefers-color-scheme`, choice persisted
in `localStorage`, applied before paint by the boot script.

- **Pros:** honors the original identity; respects user preference; readers who
  read in daylight get a comfortable theme.
- **Cons:** every component, the field, code highlighting, imagery, and OG
  surfaces must be verified twice; the phosphor "glow" metaphor needs a light
  equivalent (ink bleed rather than light emission).

### Option B — System-preference light theme, no toggle

Same palette, chosen only by `prefers-color-scheme`.

- **Pros:** less UI; no persistence logic.
- **Cons:** readers cannot override their OS; harder to test both themes
  manually.

### Option C — Stay dark-only and delete the dormant values

- **Pros:** one theme to maintain; smallest CSS.
- **Cons:** drops the paper-CRT identity the author wants.

## Decision

**Option A** (the first-visit default is open question 1).

Scope of the work once accepted:

1. **Palette (designer brief first):** paper ground and elevated surface;
   neutral text ramp meeting 4.5:1 (secondary/tertiary included); a phosphor
   text step meeting 4.5:1 on paper and a phosphor accent meeting 3:1 for
   non-text; status hues re-checked; the "glow" becomes a subtle ink halo or is
   removed in light. No new hue.
2. **Tokens:** one canonical override block per theme
   (`:root[data-theme="light"]`, `:root[data-theme="dark"]`) generated so the
   media-query fallback cannot drift (or a single source with the media block
   derived by a build step).
3. **Boot + toggle:** the boot script reads `localStorage.theme`, falls back to
   `prefers-color-scheme`, sets `data-theme` before paint; the toggle is a
   `Button` with ASCII text and `aria-pressed`.
4. **Field and imagery:** `PhosphorField` re-reads colors on theme change;
   pointillism draws dark ink dots on paper in light; `docs/imagery.md` gains
   the light-ground rules.
5. **Code:** Shiki CSS variables get light values.
6. **Verification:** every page and component at desktop and ≤ 640px in both
   themes; contrast measured, not estimated.

## Consequences

- Twice the visual verification for every UI change from then on; the design
  conformance checklist gains "both themes".
- A new toggle in the header and a small client script.
- ADR on acceptance; `docs/design-language.md` (Theme System) and
  `docs/design-system.md` (Theme) updated.

## Resolved questions (author, 2026-10-09)

1. **First-visit default:** follow `prefers-color-scheme`; the toggle overrides
   it and the choice is remembered in `localStorage`.
2. **Glow in light:** a faint, single-layer, low-alpha dark-green ink halo — the
   CRT metaphor kept, without washing out on paper.
3. **Background imagery in light:** the same `bg.jpg` sources, rendered by
   `PhosphorField` as dark phosphor-ink dots on paper (luminance inverted at
   sampling); `docs/imagery.md` gains the light-ground rules. No new assets.

Sequencing: implemented after RFC-011, so the second theme lands on a tested
component base.

## Resolution

Implemented on 2026-10-09; recorded in
[ADR-014](../../decisions/ADR-014-paper-crt-light-theme.md). From the palette
study the author chose the green-bar ground (B, including green-bar bands on
code listings) and the halo as shown (single layer, about 28%).
