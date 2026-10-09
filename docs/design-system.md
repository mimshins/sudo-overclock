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

| Layer           | Where                      | Holds                                                                                     | Who may reference it                              |
| --------------- | -------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1. Primitives   | `:root` (+ dark overrides) | Raw values: hue ramps, surfaces, type scale, motion, focus, z, containers                 | Only layer 2 and `globals.css` base styles        |
| 2. Semantics    | `:root` (+ dark overrides) | Roles: foreground, background, border, phosphor, status, `on-*`, shiki                    | Components (CSS Modules)                          |
| 3. Tailwind map | `@theme inline`            | Re-exports layers 1–2 under Tailwind names; the only home of spacing, radius, breakpoints | Components, for `--spacing-*` / `--radius-*` only |

Rules:

- Components reference **semantic** tokens (`--color-foreground-secondary`),
  never primitives (`--color-neutral-700`) and never hex.
- A dark-theme override is written in **both** dark blocks
  (`:root[data-theme="dark"]` and the `prefers-color-scheme: dark` media block).
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
| Surfaces                 | `--color-background`, `--color-background-elevated`, `--color-background-raised`             | Page; panels and code frames; headers inside an elevated surface                                   |
| Borders                  | `--color-border-primary`, `-secondary`, `-tertiary`, `--color-border-focus`                  | Dividers and outlines; `-primary` is 2.2:1, see deviations                                         |
| Accent                   | `--color-phosphor`, `-hover`, `-active`, `-muted`                                            | Interactive emphasis, active state, glow source                                                    |
| Accent text              | `--color-phosphor-text`, `-secondary`, `-tertiary`, `-muted`                                 | Links, green headings, code accents                                                                |
| Content on a filled role | `--color-on-neutral`, `-on-phosphor`, `-on-positive`, `-on-negative`, `-on-warn`, `-on-info` | Text/icons placed on a solid role fill                                                             |
| Status                   | `--color-positive*`, `--color-negative*`, `--color-warn*`, `--color-info*`                   | Success, error, warning, information — status only, never decoration; always with a label or glyph |
| Code                     | `--shiki-*`                                                                                  | Consumed by the Shiki CSS-variables theme; do not use in components                                |

`--color-brand*` is a legacy alias of phosphor and is unused; do not adopt it.

### Typography

Two faces, never a third ([ADR-007](../decisions/ADR-007-display-typeface.md)):

- **Text face — JetBrains Mono** (`--typography-typeface-ltr` /
  `--typography-typeface-mono`): prose, UI, code, metadata, `h3`–`h6`.
- **Display face — undefined medium** (`--typography-typeface-display`): only
  the brand wordmark and `h1`/`h2`. Sizes come from the 10px grid (40 / 30 /
  20px), with `letter-spacing: 0` and `-webkit-font-smoothing: none`. Never
  subset, modify, bold, or italicize it.

| Role             | Size token                                    | Size                | Weight |
| ---------------- | --------------------------------------------- | ------------------- | ------ |
| Display h1       | `--typography-display-h1-size`                | 40px                | 400    |
| Display h2       | `--typography-display-h2-size`                | 30px                | 400    |
| Display h3/brand | `--typography-display-h3-size`, `-brand-size` | 20px                | 400    |
| h3 … h6          | `--typography-h3-size` … `h6-size`            | 28 / 22 / 18 / 16px | 500    |
| Subheading 1/2   | `--typography-subheading1-size`, `2`          | 15 / 13px           | 500    |
| Body 1/2         | `--typography-body1-size`, `2`                | 15 / 13px           | 400    |
| Caption          | `--typography-caption-size`                   | 11px                | 400    |

Each size has a matching `-leading` and `-weight` token; use them together.
Mobile (≤ 640px): display h1 → 30px, h2 → 20px (handled by `Heading`).

The **tracked label** style (uppercase caption with letter-spacing) is currently
built with raw `letter-spacing` values; reuse `Caption` instead of re-creating
it.

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
- Borders are `1px solid` (quotes use `2px`). There is no border-width token
  yet; use only these two widths.

### Elevation and glow

- No drop shadows. Depth comes from `--color-background-elevated`, borders, and
  phosphor glow.
- **Canonical glow** (text): two layers driven by `--phosphor-glow-strength` —
  `0 0 calc(4px * strength) var(--color-phosphor-glow), 0 0 calc(10px * strength) var(--color-phosphor-shadow)`.
  Headings get it through `Heading glow` (today only `h1`); other text uses the
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
  allowed long-running animation and must stop under reduced motion.
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

The shipped site is **dark-only**: the boot script in `src/app/layout.tsx` pins
`data-theme="dark"` before paint. Light values exist in `:root` (the default
layer) but are not reachable with JavaScript on and fail contrast. Design and
verify in dark. A paper-CRT light theme is proposed in
[RFC-010](../rfcs/active/RFC-010-paper-crt-light-theme.md); until it is accepted
and shipped, do not design for light.

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

| Pattern          | How it is built today                                                                  | Rule                                                                               |
| ---------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| ASCII affordance | Bracketed lowercase labels: `[ home ]`, `[ read the blog ]`, `[ copy ]` → `[ copied ]` | All actions and nav links; lowercase; one space inside brackets                    |
| Leader           | `Leader` primitive: `──── name.md ────` (U+2500 rules, `aria-hidden`)                  | Page and section heads (`as="h2"` for sections); filename-style lowercase label    |
| Prompt glyph     | `>` before the brand and the active TOC item                                           | Marks "current"/"command"; `aria-hidden`                                           |
| Tag chip         | `Tag` (pill, `--radius-full`), no brackets                                             | Filters and taxonomy only                                                          |
| Glitch           | Button hover chromatic shift; `.glitch-once` / `.glitch-on-hover` utilities            | Button hover, the 404 heading, future hero/header moments; one-shot, never looping |
| Scanlines        | `.scanlines` utility (`::after` gradient overlay, `--scanline-*`)                      | Hero and error surfaces only (today: 404); never behind long-form reading          |
| Glow             | `Heading glow` (headings), `.phosphor-glow` utility (other text)                       | Emphasis on one element per view; never on body text or long-form reading          |
| Glass panel      | Post cards, about/reading panels: translucent background + `backdrop-filter`           | Reuse the existing recipe; do not invent new blur/opacity values (see deviations)  |
| Phosphor field   | `PhosphorField` canvas: procedural (home) or image-sampled (blog/about/reading)        | Background only; one per page; `glowOnHover` only where the page is mostly empty   |
| Code             | `CodeBlock` / Shiki frames on `--color-background-elevated`, `[ copy ]` button         | Every fence has a language                                                         |

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
    color: var(--tag-color);
    border-color: var(--tag-border);
  }

  .active {
    --tag-color: var(--color-phosphor-text);
    --tag-border: var(--color-phosphor);
  }
  ```

- State selectors (`:hover`, `.active`) also set variables, not properties.
- Verify the variant actually changes rendering — a variable nobody reads is a
  silent no-op (see deviations).

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
- [ ] Verified at desktop and ≤ 640px, in the dark theme.
- [ ] New tokens/variants/components documented here and in `components.md`.

## Known deviations

Current code that does not meet this system; do not copy these patterns. Each
fix removes its entry here in the same change.

- **No-op props:** `Button` `size` (size variables never read), `Lead` `size`
  (`--lead-size` never read), `Caption` `uppercase={false}` (missing class);
  `ListItem` ignores `as`.
- **Contrast:** `--color-foreground-muted` and `--color-border-primary` are
  2.2:1 in dark; muted text is used for tag counts and `Caption` muted.
- **Missing `data-slot`:** many route and blog presentation elements (site
  header/footer, pages, post list/header, TOC, code copy, cover image).
- **State classes setting properties directly:** site header links, TOC links,
  code copy, post-list cards.
- **Raw values without tokens:** letter-spacing (`.02em`–`.15em`, including the
  `Leader`), font weights 500/600, glass-panel blur/opacity percentages, code
  font size `.875rem`/line-height `1.55` (duplicated), fixed reading-cover
  sizes, the 404 art's unitless `line-height: 1`.
- **Copy-pasted patterns:** the glow recipe (3 places), post title and prose
  headings re-implementing `Heading`.
- **Accessibility:** identical `aria-label="read more"` on both home CTAs; sort
  toggle hides its state; `[ copied ]` not announced; filter tags lack
  `aria-pressed`; hover-mode `PhosphorField` still animates under reduced
  motion.
- **Fonts:** JetBrains Mono loads from the Google Fonts CDN (not self-hosted);
  the RTL stack names `Vazirmatn`, which is never loaded.
- **`color-mix` tints:** glass panels, translucent borders, and the image sheen
  mix semantic colors with `transparent` at ad-hoc percentages in
  `about.module.css`, `reading.module.css`, `site-header.module.css`,
  `post-images.module.css`, and `post-list.module.css`. stylelint forbids
  `color-mix` everywhere else; these files are exempt until a glass-panel token
  recipe exists.
- **Enforcement:** stylelint blocks colors, `color-mix`, primitive color tokens,
  and raw durations outside `globals.css`, but not yet raw lengths,
  letter-spacing, or weights (no tokens exist for them); `data-slot` is a review
  rule.

## Design decisions

Recorded in [ADR-010](../decisions/ADR-010-design-system-foundations.md): 16px
root; box-drawing leaders through `Leader`; scanlines and one-shot glitch on the
404 page; distinct status hues for status only; imagery per
[`imagery.md`](./imagery.md); stylelint enforcement.

Open: the paper-CRT light theme
([RFC-010](../rfcs/active/RFC-010-paper-crt-light-theme.md)).
