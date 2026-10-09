# Imagery & Illustration

How images look on sudo-overclock and how to make new ones that belong. It
extends the identity in [`design-language.md`](./design-language.md) and the
system in [`design-system.md`](./design-system.md) to everything that is not
text or UI chrome: backgrounds, post illustrations, diagrams, icons, and brand
marks.

The short version: **images are rendered by the screen, not pasted onto it.**
Every image reads as if the phosphor display drew it — with pixels, dots, two
inks, and abstract structure.

## The four styles

| Style                    | What it is                                                          | Use it for                                                     |
| ------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Pixel art**            | Shapes built on a visible square grid; hard edges, no anti-aliasing | Icons, brand marks, the favicon, small spot illustrations, 404 |
| **Pointillism (dotted)** | Form described by dots — density and size carry tone                | Page backgrounds, hero images, large atmospheric illustrations |
| **Duo-color**            | Exactly two inks: one phosphor ink on the dark ground               | The default palette for every illustration and diagram         |
| **Abstract**             | Non-figurative structure: grids, fields, signals, noise, geometry   | Concepts with no literal picture (latency, consensus, entropy) |

They combine: a pointillist background is also duo-color; a pixel-art spot
illustration can be abstract. Duo-color is not optional — it is the palette the
other three are drawn in.

### Pixel art

- Draw on an integer grid: **16 × 16** for icons and marks (the favicon,
  `src/app/icon.svg`), **8 px or 4 px cells** for larger pieces. Every edge
  lands on the grid; no half pixels, no rotation off 90°.
- No anti-aliasing and no gradients inside a shape. Tone comes from dithering
  (checkerboard or ordered patterns), not blur.
- Scale only by integers (×2, ×3, …).
- **Prefer SVG.** Draw cells as `<rect>`/`<path>` on the grid and set
  `shape-rendering="crispEdges"` on the root `<svg>`. SVG passes through the
  post compiler untranscoded (only hashed), so edges stay sharp.
- For raster pixel art (PNG), export at final display size × an integer and
  render with `image-rendering: pixelated`. Raster images in posts are
  re-encoded to lossy AVIF/WebP
  ([ADR-004](../decisions/ADR-004-post-asset-pipeline.md)), which softens hard
  edges — use SVG whenever the art is flat-color.

### Pointillism (dotted)

- Tone is dot **density and size**, never opacity gradients or blur. Dots sit on
  a regular pitch (the field uses 4 px for images, 8 px for the procedural home
  field) with slight jitter, so the grid is felt but not seen.
- The live version is the `PhosphorField` canvas
  (`src/shared/ui/phosphor-field*`): it samples a source image into phosphor
  dots (`IMAGE_STYLE`) or draws a procedural dithered field
  (`PROCEDURAL_STYLE`). Use it for page backgrounds instead of showing a picture
  directly.
- On the light theme the same sources render as **ink on paper**: every dot
  takes the ink color (`--color-phosphor`) and its opacity follows the source
  pixel's luminance, so light becomes ink and dark stays bare paper
  (`--phosphor-field-render: ink`; overall weight via
  `--phosphor-field-ink-strength`). No separate light-graded assets.
- Static pointillist illustrations follow the same rules: one ink, round or
  square dots, pitch between 3 and 8 px at display size, on the theme's ground.
- Leave quiet zones where text sits; a background must never compete with the
  column it sits behind.

### Duo-color

- **Ground:** the page background (`--color-background`: near-black on dark,
  green-bar paper on light). **Ink:** phosphor (`--color-phosphor` family —
  bright on dark, deep ink green on light). That is the whole palette.
- Tonal range comes from the technique (dither, dot density, line weight), or
  from steps of the **same** phosphor ramp — never from a second hue.
- A neutral ink (the `--color-foreground-*` greys) may replace phosphor for
  low-emphasis diagrams; never mix neutral and phosphor inks as two separate
  colors in one image, except phosphor used as the single highlight in an
  otherwise neutral diagram.
- Status hues (rust, amber, cyan) are for UI status, not illustration.
- Glow is allowed as the ink's halo (as on headings); no drop shadows, no
  lighting effects, no gradients between colors.
- Inline SVG uses `currentColor` or the CSS tokens so the art follows the theme
  in both modes; raster art that cannot follow the theme (a fixed PNG) must read
  on both grounds or ship as SVG instead.

### Abstract

- Show the idea, not a scene: grids, packets, waveforms, graphs, noise fields,
  interference, blocks and voids.
- Geometry is orthogonal and grid-aligned, consistent with pixel art; curves are
  allowed when built from dots.
- No clip-art people, no stock-photo metaphors (handshakes, lightbulbs,
  rockets), no 3D renders, no glossy UI mockups, no emoji, no logos of other
  products except in diagrams that are literally about them.
- Diagrams are abstract illustrations with labels: monospace labels (JetBrains
  Mono), lowercase, duo-color, box-drawing or 1 px lines, ASCII arrows where
  they read well.

## Source images

Photographs and other source images (including generated ones) are **raw
material**, not finished imagery:

- Page backgrounds (`public/<route>/bg.jpg`) are sources for `PhosphorField`.
  They are 1536 × 1024, dark, graded toward phosphor green, with one clear
  subject and large dark areas. The visitor sees them only as dots.
- A background relates to its page: the desk and terminal for the blog, an open
  book with the line being read in inverse video for reading, a fingerprint
  mid-scan (`whoami`) for about. Keep the subject near the center; tall pages
  cover-crop the sides away, and the text column sits over frosted panels.
- Encode sources with mozjpeg at quality ~82 (about 100–200 KB). The 4 px dots
  hide the artifacts, and the field preloads the source on every page.
- Procedural sources ship with their generator so they can be regenerated: the
  about and reading sources come from `scripts/brand/render-*-bg.ts` on the
  shared CRT toolkit in `scripts/brand/raster.ts` (`pnpm brand:backgrounds`).
- A source must be licensed for this use; record where it came from in the
  change that adds it.
- Do not show a source photo un-treated in the UI. The exceptions are product
  imagery that must be recognisable (book covers on the reading page) and
  screenshots in posts that document something real.

## Posts

- Images live next to the post in `content/raw/<slug>/` and are optimized at
  build time ([ADR-004](../decisions/ADR-004-post-asset-pipeline.md)); see
  [`authoring.md`](./authoring.md#images) for the mechanics.
- Every image has meaningful alt text describing what it shows and why it is
  there; purely decorative art is `aria-hidden` (UI) or has empty alt (`![]`).
- Never bake text the reader needs into an image; if a diagram must carry
  labels, repeat the key point in the prose.
- Screenshots and charts may keep their own colors when accuracy requires it;
  crop tightly and prefer the dark theme of the tool being shown.
- Animated images pass through untranscoded; avoid them, and never loop
  something that flashes. Respect `prefers-reduced-motion` for any motion added
  in the UI.

## Share cards (Open Graph)

Every route has a 1200 × 630 card at `<path>og.png`, rendered at build time
(`src/app/og-card.tsx`, see
[`architecture.md`](./architecture.md#page-metadata-and-share-cards)). Cards are
pointillist and duo-color like the page they share:

- **Dots:** the route's `public/<route>/bg.jpg` drawn with the live field's
  `IMAGE_STYLE` (2–4 px dots, sampled colour with grain) with two card
  overrides, because cards are seen as thumbnails: a 5 px pitch instead of 4,
  and the sampled tone lifted ×1.5. Home, which has no source, gets
  `PROCEDURAL_STYLE`'s neutral dither with heavier dots (2–3 px instead of 1–2,
  opacity 0.14–0.40 instead of 0.10–0.32) and one frozen hover patch stepped
  toward phosphor. Posts and tag pages use the blog source. The overrides live
  next to the styles they extend in `src/app/og-card.tsx`.
- **Quiet zone:** the text block (left, lower two thirds) keeps ~18 % of its
  dots — thinned by density, never by an overlay or gradient.
- **Text:** the page's Leader label on the phosphor plate, the title in the
  display face with `--display-strike` and `--display-glow` (80 px; 60/50 px for
  long post titles, on the 10 px grid), posts add `date · N min read`, then the
  wordmark (double-strike only: the title is the card's one glow) and the
  canonical URL.
- **Colour and glow:** the dark theme only (share previews have no theme), read
  from `globals.css` at build time, `var()` and `calc()` resolved — the card
  holds no hex values or glow recipe of its own.

A new background source changes its cards automatically; rebuild and look at
`out/<route>/og.png`.

## File conventions

| Kind                         | Format                   | Where                                  |
| ---------------------------- | ------------------------ | -------------------------------------- |
| Icons, marks, pixel spots    | Inline SVG, 16 × 16 grid | Component code or `src/app/` (favicon) |
| Post illustrations/diagrams  | SVG (preferred) or PNG   | `content/raw/<slug>/`                  |
| Post photos/screenshots      | JPEG/PNG source          | `content/raw/<slug>/`                  |
| Page background sources      | JPEG, 1536 × 1024        | `public/<route>/bg.jpg`                |
| Product images (book covers) | JPEG, 2:3                | `public/reading/`                      |
| Share cards (generated)      | PNG, 1200 × 630          | `<route>/og.png/route.tsx` → `out/`    |

Name files in kebab-case by content (`raft-log-replication.svg`), not by
sequence (`p1.png`).

## Checklist

- [ ] Uses one of the four styles, drawn in duo-color.
- [ ] Ink is phosphor (or neutral for low emphasis); ground is the page
      background; no second hue, no drop shadows, no gradients between colors.
- [ ] Pixel art is grid-aligned and crisp (`crispEdges` / `pixelated`);
      flat-color art is SVG.
- [ ] Pointillism uses density and size for tone; text areas stay quiet.
- [ ] Abstract, not clip-art or stock metaphor; no emoji.
- [ ] Alt text written (or explicitly decorative); no essential text baked in.
- [ ] Source images licensed, graded, and only shown treated.
- [ ] Kebab-case, content-based filename in the right location.
