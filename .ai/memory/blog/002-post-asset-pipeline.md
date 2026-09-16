# 002 — Post Asset Pipeline: Content-Addressed, Optimized Images

- **Date:** 2026-09-16
- **Topic:** blog / content pipeline
- **RFC:**
  [`.ai/rfc/004-post-asset-pipeline.md`](../../rfc/004-post-asset-pipeline.md)

## Context

`rehypeAssets` copied every local post image verbatim into
`public/posts/<slug>/` under its original basename. Nothing changed the URL when
a file changed, so responses could never be cached immutably — the source of the
staleness window noted in RFC 003 (Cloudflare in front of GitHub Pages). The
compiler also did no optimization at all: no resize, no modern formats, no
compression, no EXIF orientation. The one published post shipped 5.5 MB of
images. The body is a raw HTML string under a static export, so `next/image` is
unavailable and optimization had to happen at build time.

## Decision

Add a build-time optimization stage
(`infrastructure/compiler/image-optimizer.ts`) invoked by `rehypeAssets`:

- Compute `sha256(source bytes + transform parameters)`, truncated to 12 hex
  characters. The **source**, not the encoded output, is hashed so filenames are
  reproducible across macOS and CI despite libvips version differences.
- Auto-orient (EXIF), downscale to a 2048 px max width without upscaling, and
  encode AVIF (q55) + WebP (q80) + a same-format fallback (JPEG q82, or PNG when
  the source has alpha). Existing `image-size` header reads are replaced for
  raster images by `sharp` metadata.
- Write variants as `<basename>.<hash>.<ext>` and emit
  `<picture data-slot="post-picture">` with AVIF/WebP `<source>` elements
  wrapping an enriched `<img>` that keeps `data-slot="post-image"` and the RFC
  002 `width`/`height`/`loading`/`decoding` contract.
- SVG, animated images, and undecodable/uncodable files pass through under a
  hashed name as a plain `<img>`; decode/encode failures warn and never fail the
  build.
- `sharp` becomes a compiler `devDependency`; encoding concurrency is capped at
  four.

The client enhancer (`presentation/post-images.tsx`) now wraps the `<picture>`
(wrapping the inner `<img>` would nest a `<span>` inside `<picture>`), and
`picture { display: contents }` in `post-body.module.css` keeps the wrapper
layout-transparent.

## Rationale

Hashing and optimizing were done as one change because both rewrite the same
`copyImage` step. Source-based hashing preserves determinism and gives
Cloudflare immutable-cacheable URLs (closing the RFC 003 staleness risk) without
purge plumbing. AVIF/WebP deliver the bulk of the byte savings while the
same-format fallback keeps legacy browsers correct. The `<picture>` wrapper
composes with the existing no-CLS contract rather than replacing it. Diagnosing
this in practice showed Cloudflare's edge cache (`cf-cache-status`) is distinct
from the browser cache, so a fresh incognito visit still fetches — which the
fingerprinted URLs now make cheap and immutable.

## Consequences

- Local image URLs are content-addressed and immutable-cacheable; a replaced
  image gets a new URL, so no stale edge copies.
- Served bytes drop sharply for modern browsers; `public/posts/**` grows because
  each image ships several formats, but `compile.ts` still `rm -rf`s the
  directory on every run so variants never accumulate.
- Build time and memory increase (native `sharp`); bounded concurrency limits
  peak memory.
- Multi-width `srcset`/`sizes`, animated-image transcoding, and wiring an
  aggressive Cloudflare cache rule for `/posts/**` remain follow-ups.
- Watch: the enhancer now targets `<picture data-slot="post-picture">` first and
  falls back to lone `img[data-slot="post-image"]` (SVG/passthrough); keep the
  `data-slot` hooks if the markup contract changes.
