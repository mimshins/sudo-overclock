# ADR-015 — Readability Pass: Type Weight, Leaders, Chips, Glass

- **Status:** Accepted
- **Date:** 2026-10-09
- **Topic:** design
- **RFC:** waived by the author, who chose each option directly after reviewing
  the live v0.2.0 site (options below). Amends
  [ADR-007](./ADR-007-display-typeface.md) (display-face weight) and
  [ADR-014](./ADR-014-paper-crt-light-theme.md) (theme toggle label).

## Context

The author reported readability problems on the live v0.2.0 site, worst on the
paper theme and outside post bodies: thin body text, headings barely heavier
than body copy, leaders (`──── about.md ────`) thin and lost on the phosphor
field, an invisible TOC current-section indicator, filter chips and the sort
button blending into the page, and a stray border on the first history row. A
live audit traced them to: `-webkit-font-smoothing: antialiased` on every
element (it removes stem darkening, thinning dark-on-light text); light text and
leaders at weight 400 on translucent or field backgrounds; chips with a
transparent fill and a 2.2:1 border; glass panels only ~55% opaque; prose lines
past 90 characters; and display headings in a single-weight pixel face that
ADR-007 forbade emboldening.

## Decision

- **Display weight by double-strike.** Display headings draw the glyph a second
  time `--display-strike-offset` (0.06em) to the right in `currentColor`
  (`--display-strike`), the bitmap-font way to embolden; the font file stays
  unmodified and synthetic bold stays forbidden. The canonical glow becomes the
  `--display-glow` token, replacing three copies.
- **Ink and smoothing.** Smoothing is a theme token: `antialiased` on dark, the
  platform default on paper. Body copy uses `--color-text-body` (foreground on
  dark, one ink step lighter on paper) so headings stay the darkest ink;
  `h3`–`h6` are weight 700; prose paragraphs and lists cap at
  `--container-prose` (65ch), image paragraphs excepted.
- **Leaders.** The label is a bold phosphor tab (`--color-phosphor` fill,
  `--color-on-phosphor` text); rules in tertiary ink.
- **TOC.** The current section is bold phosphor text with a 2px rail and the `>`
  marker.
- **Contained controls.** Bracketed buttons that sit on content or the field
  (`[ newest ]`, `[ copy ]`, the home and 404 calls to action) use a new soft
  `Button` variant with no border, since the brackets already draw the edge.
  `Tag` chips get the same treatment so the filter row matches the sort button
  (same fill, height, and states; chips keep the pill shape). The fill is
  frosted: `--color-glass-control` (the raised surface) at rest and
  `--color-glass-control-hover` (the phosphor tint, `--color-background-tint`)
  with `--color-on-tint` text on hover, both at `--glass-control-opacity` (80%
  dark, 90% paper) behind `--glass-filter`. The opacity is set so that an
  unblurred field dot directly behind the label still leaves 4.5:1; the theme
  contrast test composites each fill over the background and over a phosphor dot
  to check it. The active chip, pressed buttons, and `[ copied ]` are inverse
  phosphor. Bars (navigation, footer links, the theme toggle) stay text-only.
- **Borders.** Dark `--color-border-primary` moves to a new
  `--color-neutral-550` (`#606060`, 3.1:1), clearing the theme contrast test's
  last known deviation.
- **Glass.** Panels, cards, dividers, cover placeholders, and the image sheen
  use semantic tokens (`--color-glass-surface` at 90%, `--glass-filter`,
  `--color-divider`, `--color-placeholder`, `--color-loading-sheen`); stylelint
  no longer exempts any file from its `color-mix` ban.
- **About history.** Only rows after the first draw a divider.
- **Theme toggle.** The toggle was a pressed switch always labeled `[ light ]`,
  which read as unchanged in both themes. It now names the theme it switches to
  (`[ light ]` on dark, `[ dark ]` on paper) with an `aria-label` of "switch to
  … theme" and no `aria-pressed`. Both labels are rendered and CSS shows one
  from `data-theme`, which the boot script sets before paint, so the label is
  right before hydration.

## Options considered

| Question       | Chosen                   | Also considered                                  |
| -------------- | ------------------------ | ------------------------------------------------ |
| Leaders        | phosphor tab + bold      | elevated plate (shipped first); bold only        |
| Heading weight | pixel double-strike      | bigger sizes instead; JetBrains Mono bold for h2 |
| Chips          | frosted, as the button   | outlined solid fill; bracket affordances         |
| Bracket button | frosted soft, all floats | opaque soft; ink contained; phosphor contained   |
| Body ink       | smoothing + hierarchy    | also heavier body (500); smoothing only          |

## Rationale

Each fix targets a measured cause rather than raising contrast blindly. The
double-strike adds weight while keeping the pixel grid the identity depends on,
and it is a technique native to the medium the identity imitates. Making glass,
dividers, and the sheen into tokens turns ad-hoc translucency into a rule the
linter enforces.

## Consequences

- Display headings are visibly heavier in both themes; the brand wordmark is
  unchanged.
- Every button-like surface over the phosphor field has a solid fill.
- Verified in a browser on the about, blog, and post pages in both themes; the
  theme contrast test runs with no exceptions.
