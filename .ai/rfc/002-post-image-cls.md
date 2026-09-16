# 002 — Post Image Loading: Reserved Space + Skeleton

- **Status:** Implemented
- **Date:** 2026-09-16
- **Supersedes:** —
- **Superseded by:** —

## Context

Post images are compiled from markdown to raw HTML at build time and injected
into the page with `dangerouslySetInnerHTML` (`post-body.tsx`). The compiler's
`rehypeAssets` transformer copied each local file into `public/posts/<slug>/`
and rewrote `src`, emitting only `<img src alt>`. With no intrinsic dimensions,
the browser did not know an image's size until it downloaded, so every image
pushed content down on load — a cumulative layout shift (CLS) regression.

Two constraints shaped the options: (1) the body never reaches React, so
`next/image` cannot intercept it without re-architecting the pipeline to emit a
structured AST; (2) the site is a static export with `images.unoptimized: true`,
so Next's image optimizer is unavailable anyway.

## Options

### Option A — Compiler-enriched `<img>`

- **Pros:** Smallest blast radius; keeps the HTML-string contract. Dimensions
  are read at build time and emitted as attributes, so space is reserved before
  hydration and with no JavaScript. Works under static export.
- **Cons:** No responsive `srcset` or format conversion; remote images have
  unknown dimensions and stay unreserved.

### Option B — Serialize the body to React nodes and use `next/image`

- **Pros:** Idiomatic Next component path; a natural home for `srcset`.
- **Cons:** Large architectural change to the compiler output contract and the
  domain/content repository; `next/image` still cannot optimize under
  `output: "export"`, so the main benefit is deferred.

### Option C — Pure-CSS skeleton with no compiler change

- **Pros:** No build/dependency change.
- **Cons:** Cannot reserve space without knowing dimensions — does not fix CLS,
  which is the actual problem.

## Decision

Adopt **Option A**. The compiler reads intrinsic dimensions from each local
image header (`image-size`, a build-only devDependency) and emits `width`,
`height`, `loading="lazy"`, `decoding="async"`, and `data-slot="post-image"`. A
separate `PostImages` client component wraps each image in a skeleton frame and
fades it in. The client layer is **progressive enhancement only** — the CLS fix
lives entirely in the server-rendered markup, so the page is stable with
JavaScript disabled. External and root-relative images are passed through
untouched; an unreadable file degrades gracefully (no dimensions, stderr
warning) rather than failing the build.

## Consequences

- Local post images no longer cause layout shift and lazy/decode off the main
  thread; a shimmer skeleton covers the load.
- A build-only dependency (`image-size`) joins the compiler toolchain.
- Authors are guided to prefer local assets; remote images get no reserved
  space. Responsive `srcset`/modern formats remain future work (see
  `docs/architecture.md` "Performance Considerations").
- The decision is recorded in
  [`.ai/memory/blog/001-post-image-cls.md`](../memory/blog/001-post-image-cls.md).
