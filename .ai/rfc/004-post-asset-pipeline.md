# 004 — Post Asset Pipeline: Content-Addressed, Optimized Images

- **Status:** Implemented
- **Date:** 2026-09-16
- **Supersedes:** —
- **Superseded by:** —

## Context

`rehypeAssets` (`src/modules/blog/infrastructure/compiler/assets.ts:93-121`)
copies every local post image verbatim into `public/posts/<slug>/` under its
original basename and rewrites `src` to `/posts/<slug>/<basename>`. Two problems
follow from that single `copyFile`:

1. **Stable, un-fingerprinted URLs.** Nothing about the URL changes when the
   file does, so responses can never be cached immutably. This is the exact
   staleness window recorded in [RFC 003](./003-cloudflare-cdn.md): a replaced
   image can be served stale from Cloudflare's edge and the browser for up to
   the TTL, and the free plan can only be tuned so far without a content hash.
2. **No optimization at all.** No resize, no modern formats, no compression, no
   EXIF-orientation handling. The one published post ships **5.5 MB** across
   three files — `p1.png` 1.36 MB, `p2.jpg` 1.39 MB, `poster.jpg` 1.52 MB.

[RFC 002](./002-post-image-cls.md) already established the presentation
contract: every local image carries `width`/`height`, `loading="lazy"`,
`decoding="async"`, and `data-slot="post-image"`, with a client skeleton/fade
enhancer (`presentation/post-images.tsx`). Any change here must compose with
that work rather than replace it.

Constraints: the post body is a **raw HTML string** injected by
`dangerouslySetInnerHTML` (no React), the site is a **static export**
(`output: "export"`, `images.unoptimized: true`), and there is **no runtime**.
Optimization therefore has to happen at build time, inside the compiler.

## Options

### Option A — Build-time pipeline, content-addressed (`sharp`)

- **Pros:** Free and self-contained; works under static export. Resize, rotate,
  compress, and transcode to AVIF/WebP with a fallback, and emit a
  content-hashed filename so the edge can cache immutably. Shares the existing
  header-read step and composes with RFC 002's markup. Delivering modern formats
  is where the bulk of the byte savings are.
- **Cons:** Adds a native dependency (`sharp`) to the compiler toolchain; build
  time, output size, and test surface grow. Naive output-hashing would not be
  reproducible across platforms.

### Option B — Compression only

- **Pros:** Small change; keeps a single file per image.
- **Cons:** Much smaller win; no modern formats and no hash, so it leaves both
  the bandwidth and the cache-staleness problems partly unsolved.

### Option C — CDN-side (Cloudflare Polish / Images)

- **Pros:** No build changes.
- **Cons:** **Not free** — Polish is Pro+ and Cloudflare Images is usage-priced,
  defeating the premise of RFC 003. Also cannot fix the un-hashed-URL staleness.

### Option D — Runtime via `next/image`

- **Pros:** Idiomatic Next.
- **Cons:** Unavailable: the body never reaches React and the image optimizer is
  disabled under static export. This is the same constraint that drove RFC 002.

## Decision

Adopt **Option A**, as a single change that both fingerprints and optimizes,
since both rewrite the same line of `assets.ts`.

For each **local raster** image (not external, not SVG) the compiler:

1. Computes a deterministic **content hash** from the **source bytes plus the
   transform parameters** — never from `sharp`'s output bytes. This keeps
   filenames stable across machines and libvips versions (local darwin vs CI
   linux) while still changing the URL if either the source or the transform
   changes.
2. Applies EXIF auto-orientation, downscales to a **maximum width of 2048 px**
   (never upscales), and encodes **AVIF (q≈55)**, **WebP (q≈80)**, and a
   **fallback in the source's own format** (JPEG q≈82, or optimized PNG when the
   image has alpha).
3. Writes variants as `public/posts/<slug>/<basename>.<hash>.<ext>` and emits:

   ```html
   <picture data-slot="post-picture">
     <source
       type="image/avif"
       srcset="…avif"
     />
     <source
       type="image/webp"
       srcset="…webp"
     />
     <img
       src="…fallback"
       width="…"
       height="…"
       loading="lazy"
       decoding="async"
       data-slot="post-image"
     />
   </picture>
   ```

   The `<img>` keeps `data-slot="post-image"` and the post-EXIF intrinsic
   dimensions, so RFC 002's CSS, width/height reservation, and enhancer contract
   are preserved. The client enhancer changes to wrap the `<picture>` (wrapping
   the `<img>` would nest a `<span>` inside `<picture>`, which is invalid); the
   `picture { display: contents }` rule makes the wrapper layout-transparent.

**Passthrough rules** keep the change contained:

- **SVG:** copied with a hash and emitted as a plain `<img>` (no transcode).
- **Animated GIF:** passed through unoptimized (hashed) in this phase.
- **External, root-relative, `data:`, `#`, `mailto:`:** untouched, exactly as
  today.
- **Failure:** if `sharp` cannot decode or encode, copy the original verbatim
  under a hashed name and emit a plain `<img>` with dimensions if readable; warn
  on stderr, never fail the build.

Multi-width responsive `srcset`/`sizes` is deliberately **out of scope** for
this decision and is tracked as a follow-up.

RSS and Open Graph are unaffected: I confirmed there is no per-post image in the
feed or metadata today (`Post` has no cover field; `layout.tsx` sets a global
`openGraph`), so hashed image URLs break nothing there.

## Consequences

- Local post images become immutable-cacheable, closing the staleness risk
  raised in RFC 003; Cloudflare can then cache `/posts/**` aggressively.
- Bytes served to modern browsers drop sharply (the sample PNG/JPEG are prime
  AVIF/WebP candidates), with a correct fallback for the small legacy remainder.
- The compiler gains a native dependency (`sharp`, a `devDependency` alongside
  `image-size`), more build time, and a larger `public/posts/**` output
  (multiple formats per image). `compile.ts` already `rm -rf`s `public/posts`
  each run, so hashed variants never accumulate.
- The `<picture>` wrapper touches three presentation touchpoints — the enhancer
  selector, `post-images.module.css`, and `post-body.module.css` — and they must
  ship together with the compiler change.
- The concrete compiler, markup, and test changes are specified in
  `.ai/specs/post-asset-pipeline.md`.
