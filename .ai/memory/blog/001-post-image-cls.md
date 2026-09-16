# 001 — Post Image CLS Fix

- **Date:** 2026-09-16
- **Topic:** blog / content pipeline
- **RFC:** [`.ai/rfc/002-post-image-cls.md`](../../rfc/002-post-image-cls.md)

## Context

Post images were compiled to bare `<img src alt>` markup and injected into the
page as an HTML string. With no intrinsic dimensions, the browser could not
reserve their space, so images caused cumulative layout shift (CLS) as they
loaded. `next/image` was not an option: the body never reaches React, and the
static export disables image optimization.

## Decision

Enrich local images at compile time. `rehypeAssets`
(`infrastructure/compiler/assets.ts`) reads each file's intrinsic pixel
dimensions with `image-size` and emits `width`, `height`, `loading="lazy"`,
`decoding="async"`, and `data-slot="post-image"` alongside the rewritten `src`.
A new client component `presentation/post-images.tsx` (`<PostImages />`, mounted
on the post page next to `CodeCopy`) wraps each image in a skeleton frame and
fades it in. CSS lives in `post-images.module.css`; the base placeholder is in
`post-body.module.css`.

## Rationale

Dimensions in the HTML reserve layout space **before hydration and without
JavaScript**, so the CLS fix does not depend on the client component — the
skeleton and fade are progressive enhancement. This keeps the existing
HTML-string compiler contract and needs no new module boundary. `image-size` is
a small, build-only devDependency (the compiler already runs under `tsx`).

## Consequences

- Local post images are CLS-free; offscreen images lazy-load behind a skeleton.
- Undecodable images degrade gracefully: emitted without dimensions, compiler
  warns on stderr, build does not fail.
- External (`https://…`) and root-relative (`/…`) images are passed through and
  have no reserved space — authors are told in `docs/authoring.md` to prefer
  local assets.
- Responsive `srcset` / modern-format conversion is explicitly future work.
- Watch: `PostImages` mutates the DOM after mount (like `CodeCopy`); keep it
  null-rendering and side-effect-scoped to `[data-slot="post-body"]`.
