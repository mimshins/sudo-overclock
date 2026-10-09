# Design System

The implementable form of the identity in
[`design-language.md`](./design-language.md). The design language says **what
the site should feel like and why**; this document says **which tokens,
primitives, and patterns produce that feel, and the rules for extending them
without drift**. Component APIs live in [`components.md`](./components.md);
images and illustration in [`imagery.md`](./imagery.md).

Written for both people and AI agents: every rule is checkable, every token is
named, and known deviations are listed rather than hidden. When this document
and the code disagree, the code is the current truth — fix the code or this
document in the same change (see [Known deviations](#known-deviations)).

## How to design a feature

Work down this list and stop at the first step that solves the problem:

1. **Reuse** an existing primitive or pattern as-is.
2. **Compose** existing primitives and patterns.
3. **Add a variant** to an existing primitive (local custom properties only).
4. **Add a semantic token** that maps to an existing primitive value.
5. **Add a component** (shared primitive if domain-free, module component
   otherwise).
6. **Add a primitive value** (new hue step, size, duration) — rare; needs a
   reason recorded in the change.
7. **Change the identity** (typeface, accent, theme model, motion character) —
   needs an RFC and an ADR (precedent:
   [ADR-007](../decisions/ADR-007-display-typeface.md)).

Every UI change ends with the [conformance checklist](#conformance-checklist).

## Token architecture

All tokens live in [`src/app/globals.css`](../src/app/globals.css) — the only
file that may contain raw values (hex, rgb, px sizes, durations).

| Layer           | Where                                   | Holds                                                                                     | Who may reference it                              |
| --------------- | --------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1. Primitives   | `:root` (dark) + `[data-theme="light"]` | Raw values: hue ramps, surfaces, type scale, motion, focus, z, containers                 | Only layer 2 and `globals.css` base styles        |
| 2. Semantics    | `:root` (dark) + `[data-theme="light"]` | Roles: foreground, background, border, phosphor, status, `on-*`, shiki                    | Components (CSS Modules)                          |
| 3. Tailwind map | `@theme inline`                         | Re-exports layers 1–2 under Tailwind names; the only home of spacing, radius, breakpoints | Components, for `--spacing-*` / `--radius-*` only |

Rules:

- Components reference **semantic** tokens (`--color-foreground-secondary`),
  never primitives (`--color-neutral-700`) and never hex.
- `:root` holds the dark values; a light override goes in the one
  `:root[data-theme="light"]` block of the same layer. There is no media-query
  copy to keep in sync — the boot script always sets the attribute.
- New tokens follow the existing names: `--color-<role>[-state]`,
  `--color-on-<role>`, `--typography-<role>-size|leading|weight`,
  `--duration-*`, `--easing-*`, `--z-<n>`, `--container-*`. Component-local
  variables are `--<component>-<prop>` and never leave the component's module.
- When a token is used through its Tailwind alias, use one tier consistently
  within a file (prefer `--typography-*` for type; see deviations).

### Root size

The root is the browser default, **16px**; `body` sets the body1 size (15px) and
leading. Every `rem` token therefore renders at its nominal value: spacing lands
on the 4px grid and line heights on whole pixels
([ADR-010](../decisions/ADR-010-design-system-foundations.md)).

### Color

The palette is **neutral + one phosphor accent**. Status hues exist for status
only.

| Role                     | Tokens                                                                                       | Use                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Text                     | `--color-foreground`, `-secondary`, `-tertiary`                                              | Body, secondary meta, tertiary hints                                                               |
| Text (decorative only)   | `--color-foreground-muted`                                                                   | Fails contrast (2.2:1) — never for information-bearing text                                        |
| Surfaces                 | `--color-background`, `--color-background-elevated`, `--color-background-raised`             | Page; panels and code frames; headers inside an elevated surface and soft-button fills             |
| Tint                     | `--color-background-tint`, `--color-on-tint`                                                 | Phosphor-tinted raised fill and its text: the hover state of contained controls                    |
| Frosted control          | `--color-glass-control`, `-hover`, `--glass-control-opacity`, `--glass-filter`               | Contained controls over the field; opacity keeps 4.5:1 over an unblurred dot (contrast-tested)     |
| Borders                  | `--color-border-primary`, `-secondary`, `-tertiary`, `--color-border-focus`                  | Dividers and outlines; `-primary` is ≥3:1 in both themes                                           |
| Accent                   | `--color-phosphor`, `-hover`, `-active`, `-muted`                                            | Interactive emphasis, active state, glow source                                                    |
| Accent text              | `--color-phosphor-text`, `-secondary`, `-tertiary`, `-muted`                                 | Links, green headings, code accents                                                                |
| Content on a filled role | `--color-on-neutral`, `-on-phosphor`, `-on-positive`, `-on-negative`, `-on-warn`, `-on-info` | Text/icons placed on a solid role fill                                                             |
| Status                   | `--color-positive*`, `--color-negative*`, `--color-warn*`, `--color-info*`                   | Success, error, warning, information — status only, never decoration; always with a label or glyph |
| Code                     | `--shiki-*`                                                                                  | Consumed by the Shiki CSS-variables theme; do not use in components                                |

`--color-brand*` is a legacy alias of phosphor and is unused; do not adopt it.

### Typography

Two faces, never a third ([ADR-007](../decisions/ADR-007-display-typeface.md)):

- **Text face — JetBrains Mono** (`--typography-typeface-ltr` /
  `--typography-typeface-mono`): prose, UI, code, metadata, `h3`–`h6`. The
  variable font (with italics) is self-hosted through `next/font/google`, which
  downloads it at build time; readers never request a third-party font host
  ([ADR-016](../decisions/ADR-016-design-drift-cleanup.md)).
- **Display face — undefined medium** (`--typography-typeface-display`): only
  the brand wordmark and `h1`/`h2`. Sizes come from the 10px grid (40 / 30 /
  20px), with `letter-spacing: 0` and `-webkit-font-smoothing: none`. Never
  subset, modify, synthetically bold, or italicize it. Weight comes from the
  pixel **double-strike** — the glyph drawn again `--display-strike-offset`
  (0.06em) to the right in `currentColor` via `--display-strike`
  ([ADR-015](../decisions/ADR-015-readability-pass.md)); every display heading
  uses it.
- **Body copy** uses `--color-text-body`: the foreground on dark, one ink step
  lighter (`--color-foreground-secondary`) on paper, so headings stay the
  darkest ink. Prose paragraphs and lists cap at `--container-prose` (65ch).
- **Smoothing** comes from `--font-smoothing-webkit` / `-moz`: `antialiased` on
  dark, the platform default on paper (antialiased thins dark-on-light text).
- `h3`–`h6` (JetBrains Mono) are weight 700.

| Role             | Size token                                    | Size                | Weight |
| ---------------- | --------------------------------------------- | ------------------- | ------ |
| Display h1       | `--typography-display-h1-size`                | 40px                | 400    |
| Display h2       | `--typography-display-h2-size`                | 30px                | 400    |
| Display h3/brand | `--typography-display-h3-size`, `-brand-size` | 20px                | 400    |
| h3 … h6          | `--typography-h3-size` … `h6-size`            | 28 / 22 / 18 / 16px | 700    |
| Subheading 1/2   | `--typography-subheading1-size`, `2`          | 15 / 13px           | 500    |
| Body 1/2         | `--typography-body1-size`, `2`                | 15 / 13px           | 400    |
| Caption          | `--typography-caption-size`                   | 11px                | 400    |

Each size has a matching `-leading` and `-weight` token; use them together.
Mobile (≤ 640px): display h1 → 30px, h2 → 20px (handled by `Heading`).

Weights, tracking, and code type have their own scales; stylelint rejects raw
`letter-spacing` and `font-weight` values outside `globals.css`:

| Scale    | Tokens                                                                                       | Values                         |
| -------- | -------------------------------------------------------------------------------------------- | ------------------------------ |
| Weight   | `--typography-weight-regular`, `-medium`, `-semibold`, `-bold`                               | 400 / 500 / 600 / 700          |
| Tracking | `--typography-tracking-tight`, `-snug`, `-wide`, `-wider`, `-widest` (plus literal `0`)      | −0.02 / .02 / .05 / .1 / .15em |
| Code     | `--typography-code-size`, `-code-leading`, `-code-inline-size`; `--typography-glyph-leading` | .875rem / 1.55 / .875em / 1    |

The **tracked label** style (uppercase caption with letter-spacing) is
`Caption`; reuse it instead of re-creating it. `--typography-glyph-leading` is
for glyph art that must touch line to line (the 404 block letters, the quote
mark).

### Spacing, radius, borders

| Token           | Multiple of `--spacing` (4px) | Size |
| --------------- | ----------------------------- | ---- |
| `--spacing-xxs` | ½×                            | 2px  |
| `--spacing-xs`  | 1×                            | 4px  |
| `--spacing-sm`  | 2×                            | 8px  |
| `--spacing-md`  | 4×                            | 16px |
| `--spacing-lg`  | 4.5×                          | 18px |
| `--spacing-xl`  | 6×                            | 24px |
| `--spacing-xxl` | 8×                            | 32px |

- Use only these steps for padding, margin, and gap. No `calc()` of arbitrary
  multiples.
- Radius: `--radius-none` for panels, buttons, and cards; `--radius-sm` for
  small inline chrome; `--radius-full` only for tag/status pills. Other radius
  tokens exist but are not part of the identity.
- Borders use `--border-width-thin` (1px) or `--border-width-thick` (2px:
  quotes, the TOC rail, the key cap's bottom edge); stylelint rejects raw widths
  outside `globals.css`.
- Fixed component sizes are tokens: `--size-control` (32px icon buttons),
  `--size-cover-md` / `-sm` (96 / 72px book covers, 2:3).

### Elevation and glow

- No drop shadows. Depth comes from `--color-background-elevated`, borders, and
  phosphor glow.
- **Canonical glow** (text) is the `--display-glow` token — two layers driven by
  `--phosphor-glow-strength`. Headings get it through `Heading glow`, the post
  title and prose `h1` through
  `text-shadow: var(--display-strike), var(--display-glow)`; other text uses the
  `.phosphor-glow` utility (the 404 art). Never re-declare the recipe.
  `.phosphor-glow-strong` exists but is unused and not part of the identity.
- `--shadow-sm|md|lg` exist but are unused; prefer not to introduce them.
- Z-index uses `--z-0 … --z-50` only (scanlines/skip link 50, noise 40). The
  phosphor canvas sits at `-1` inside an isolated `.noise` container.

### Motion

| Token                | Value    | Use                                             |
| -------------------- | -------- | ----------------------------------------------- |
| `--duration-fast`    | 80ms     | Color/opacity on hover and focus                |
| `--duration-normal`  | 120ms    | Border and state changes; glitch steps          |
| `--duration-slow`    | 150ms    | Fades in (images), menu open                    |
| `--duration-loading` | 1600ms   | Looping loading affordances only (image sheen)  |
| `--easing-standard`  | ease-out | Everything; `steps(n)` for glitch-style effects |

- Snap, not jelly: ≤ 150ms for interaction feedback, no spring or slow easing,
  no parallax, no periodic flicker.
- **Every motion has a `prefers-reduced-motion: reduce` path.** CSS is handled
  globally in `globals.css`; **JS/canvas motion must check the media query
  itself** (as `PhosphorField` does) and stop animating, not just shorten.
- Loading affordances (the image sheen, `--duration-loading`) are the only
  allowed long-running animation and must stop under reduced motion. The one
  exception is the background itself: `PhosphorField`'s slow drift and, on touch
  screens, its rolling swell (one slow crest sweeping across every few seconds,
  never a flicker). Both stop under reduced motion
  ([ADR-019](../decisions/ADR-019-touch-rolling-swell.md)).
- Glitch is one-shot: `.glitch-on-hover` (on hover) and `.glitch-once` (on first
  render) play `@keyframes glitch` over `--duration-normal` with `steps(2)`.

### Focus and accessibility

- Focus is always visible: the global `:focus-visible` ring (`--focus-ring-*`).
  Do not override or remove it per component.
- Text contrast ≥ 4.5:1 (≥ 3:1 for ≥ 24px display text); non-text UI (outlines,
  focus, icons) ≥ 3:1. Check new token pairings against the dark surfaces.
- Accessible names contain the visible text (`[ read the blog ]` → name includes
  "read the blog"); toggles expose state (`aria-pressed`, `aria-expanded`);
  transient status (`[ copied ]`) is announced via a live region.
- Every page's main landmark is `<main id="main">` (skip-link target).
- Decorative layers (canvas, noise, prompt glyphs) are `aria-hidden`.

## Theme

Two themes ([ADR-014](../decisions/ADR-014-paper-crt-light-theme.md)):

- **Dark** — phosphor on near-black. The base `:root` tokens and the no-JS
  default.
- **Light (paper-CRT)** — ink on green-bar paper. One
  `:root[data-theme="light"]` block per layer remaps surfaces to the `paper`
  ramp, phosphor to a deep ink green (`--color-phosphor-950`, so small phosphor
  text keeps 4.5:1), the glow to a faint single-layer ink halo, and the CRT
  effects to softer strengths.

`src/app/theme.ts` holds the boot script (stored choice, else
`prefers-color-scheme`, else dark; set before paint) and the `ThemeToggle` in
the header (labeled with the theme it switches to — `[ light ]` on dark,
`[ dark ]` on paper — swapped in CSS from `data-theme` so it is right before
hydration; remembered; follows the OS until the reader chooses). Theme changes
are a `data-theme` attribute swap — CSS does the rest; `PhosphorField` re-reads
its colors on the swap.

Rules:

- Design and verify every change in **both** themes, at desktop and ≤ 640px.
- New tokens get a light override whenever their dark value would not hold on
  paper; never branch on the theme in components.
- `src/app/theme-contrast.test.ts` resolves the tokens of both themes from
  `globals.css` and fails when text, phosphor and status text, selection, focus,
  borders, filled-button text, or code-highlight tokens fall under their WCAG
  targets. Add a pair there for every new foreground/background role.
- Code blocks on paper carry green-bar bands (`--color-code-band`, one band
  every other line); on dark the token is transparent.
- Text selection is inverse video in both themes (`--color-selection-background`
  / `--color-selection-foreground`).

## Layout

- **Shell:** skip link → `SiteHeader` → `<main id="main">` → `SiteFooter`;
  `body` is a full-height flex column. Header/footer content width is
  `--container-wide` (72rem).
- **Standard page:** a centered column with `padding: var(--spacing-xl)` and
  `gap: var(--spacing-md)`; order is leader → `Heading as="h1" size="h1" glow` →
  content capped at `--container-narrow` (42rem). Below 640px,
  `padding-inline: var(--spacing-md)`.
- **Post page:** grid of `minmax(0, 1fr)` + a 16rem sticky aside (TOC) at
  `--container-wide`; below 64rem it collapses to one column with the aside
  first.
- **Breakpoints:** use only `640px` (mobile) and `64rem` (post grid); `400px`
  exists for one reading-page detail. Custom properties cannot be used in
  `@media`, so these raw values are allowed in `@media` queries only.
- **Background:** pages that show the phosphor field put `.noise` on `<main>`
  (it provides `position: relative` and `isolation`) and render `PhosphorField`
  inside it. Keep the two together.

## Patterns

| Pattern          | How it is built today                                                                                                         | Rule                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| ASCII affordance | Bracketed lowercase labels: `[ home ]`, `[ read the blog ]`, `[ copy ]` → `[ copied ]`                                        | All actions and nav links; lowercase; one space inside brackets                                              |
| Leader           | `Leader` primitive: `──── name.md ────` — rules in tertiary ink, the label a bold phosphor tab (`--color-on-phosphor`)        | Page and section heads (`as="h2"` for sections); filename-style label, written lowercase (CSS uppercases it) |
| Floating button  | Soft `Button` (`variant="soft"`): frosted raised fill, no border; hover frosts with the tint; pressed is inverse video        | Bracketed actions that sit on content or the field (CTAs, sort, `[ copy ]`); bars stay text-only             |
| Prompt glyph     | `>` before the brand and the active TOC item                                                                                  | Marks "current"/"command"; `aria-hidden`                                                                     |
| Tag chip         | `Tag`: borderless pill with the floating button's frosted fill and hover; the active chip is inverse video (`aria-pressed`)   | Filters and taxonomy only                                                                                    |
| Glitch           | Button hover chromatic shift; `.glitch-once` / `.glitch-on-hover` utilities                                                   | Button hover, the 404 heading, future hero/header moments; one-shot, never looping                           |
| Scanlines        | `.scanlines` utility (`::after` gradient overlay, `--scanline-*`)                                                             | Hero and error surfaces only (today: 404); never behind long-form reading                                    |
| Glow             | `Heading glow` (headings), `.phosphor-glow` utility (other text)                                                              | Emphasis on one element per view; never on body text or long-form reading                                    |
| Glass panel      | Post cards, about/reading panels: `--color-glass-surface` (90% elevated) + `--glass-filter`; dividers use `--color-divider`   | Use the tokens; never mix your own translucency                                                              |
| Phosphor field   | `PhosphorField` canvas: procedural (home) or image-sampled (blog/about/reading); touch screens get a rolling swell, not hover | Background only; one per page; `glowOnHover` only where the page is mostly empty                             |
| Code             | `CodeBlock` / Shiki frames on `--color-background-elevated`, soft `[ copy ]` button (inverse once copied)                     | Every fence has a language                                                                                   |

Seven shared primitives (`Blockquote`, `CodeBlock`, `InlineCode`, `Kbd`, `Lead`,
`List`, `Paragraph`) are currently unused by the app because post prose styles
raw elements in `post-body.module.css`. New UI outside post bodies uses the
primitives; post bodies keep the prose styles.

## Extension rules

### Adding a token

1. Prefer a **semantic** token that points to an existing primitive.
2. Add it to layer 2 in `globals.css`, plus both dark blocks if it changes in
   dark. Expose it in `@theme inline` only if Tailwind naming is needed.
3. Name it by role, not by look (`--color-border-focus`, not
   `--color-green-line`).
4. Document it in the tables above in the same change.

### Adding a variant or size

- The base class declares each property **once**, reading local variables;
  variant/size classes **only set those variables**. Map props to classes with a
  static `Record<Variant, ClassValue>` and compose with `cx`
  (`@repo/shared/lib/cx`). Example:

  ```css
  .tag {
    --tag-color: var(--color-foreground);
    --tag-background: var(--color-glass-control);

    color: var(--tag-color);
    background-color: var(--tag-background);
  }

  .active {
    --tag-color: var(--color-on-phosphor);
    --tag-background: var(--color-phosphor);
  }
  ```

- State selectors (`:hover`, `.active`) also set variables, not properties.
- Verify the variant actually changes rendering — a variable nobody reads is a
  silent no-op, and the CSS-module contract test fails on it.

### Adding a component

- Domain-free → `src/shared/ui/<kebab>.tsx` + `<kebab>.module.css`; blog-only →
  `src/modules/blog/presentation/`; route chrome → `src/app/`.
- Every element exposing `className` carries `data-slot="<name>"`.
- Polymorphic (`as`) when the semantic element can vary; forward the rest props.
- Server component by default; `"use client"` only for state, effects, or
  events.
- Add it to [`components.md`](./components.md).

### Adding a page

Compose the standard page pattern (leader, glowing `h1`, narrow column); add
`.noise` + `PhosphorField` only if the page needs the background; give `<main>`
`id="main"`; add the route to the header nav only if it is top-level.

## Conformance checklist

- [ ] Only semantic tokens in CSS Modules; no hex, rgb, or ad-hoc px/ms (except
      `@media` breakpoints listed above).
- [ ] Spacing from `--spacing-*`; radius from the allowed set; 1px/2px borders.
- [ ] Display face only for brand and `h1`/`h2` at 10px-grid sizes.
- [ ] Phosphor is the only accent; status colors only for status.
- [ ] Variants/states set local variables only, and each one visibly changes
      rendering.
- [ ] `data-slot` on every `className` layer.
- [ ] ASCII bracket affordances; no emoji in chrome.
- [ ] Motion ≤ 150ms with `ease-out`/`steps`; reduced-motion path for CSS and
      JS.
- [ ] Focus-visible ring intact; contrast targets met; accessible names contain
      visible text; state exposed.
- [ ] Verified at desktop and ≤ 640px, in the dark **and** light themes; the
      theme contrast test passes.
- [ ] New tokens/variants/components documented here and in `components.md`.

## Known deviations

Current code that does not meet this system; do not copy these patterns. Each
fix removes its entry here in the same change.

- **Drawn chrome:** the burger icon bars (16 × 2px, 6px apart), glow radii, and
  the button glitch offsets are raw pixel values; they draw an icon or an effect
  rather than lay out a component.
- **Prose headings:** `post-body.module.css` styles the compiler's raw `h1`–`h6`
  instead of using `Heading` (the HTML comes from markdown, so the component
  cannot be used); they read the same `--display-*` and `--typography-*` tokens.
- **Enforcement:** stylelint blocks colors, `color-mix`, primitive color tokens,
  raw durations, and raw `letter-spacing`, `font-weight`, and border widths
  outside `globals.css`; other raw lengths are not linted. `data-slot` is a
  review rule (shared primitives write theirs last, so callers cannot override
  it). The CSS-module contract test (`css-module-contract.test.ts`) fails on a
  local custom property nobody reads or a `styles.<name>` with no class.

## Design decisions

Recorded in [ADR-010](../decisions/ADR-010-design-system-foundations.md): 16px
root; box-drawing leaders through `Leader`; scanlines and one-shot glitch on the
404 page; distinct status hues for status only; imagery per
[`imagery.md`](./imagery.md); stylelint enforcement.

The paper-CRT light theme:
[ADR-014](../decisions/ADR-014-paper-crt-light-theme.md).
