# 000 — Blog Module Overview

The `blog` module owns all content and the pipeline that turns it into pages.

## Layers

- `domain/post.ts` — `Post`, `PostSummary`, `PostFrontmatter`, `PostTocItem`.
  Pure types, no imports outside the module.
- `application/blog.ts` — `createBlogServices` exposes `listPosts`, `getPost`,
  `listTags`, `listPostsByTag`; sorts by date with a title tie-break.
- `application/ports/content-repository.ts` — the `ContentRepository` port.
- `infrastructure/compiled-content-repository.ts` — adapter over the generated
  `content/compiled/index.ts`.
- `infrastructure/compiler/` — the markdown → HTML compiler (Unified,
  remark-gfm, Shiki, heading anchors, asset copy, reading time).
- `infrastructure/authoring/` — the human/AI authoring CLI behind
  `pnpm author:*`.
- `presentation/` — post list, post body, header, TOC, filter components.

## Content locations

- `content/raw/<slug>/<slug>.md` — published source + co-located assets.
- `content/compiled/index.ts` — generated; gitignored.
- `content/drafts/<slug>/` — in-progress posts, excluded from the build.

## Workflow

Writing follows `.ai/skills/post-authoring/pipeline.md`. The mechanical steps
are `pnpm author:new`, `pnpm author:preflight`, `pnpm author:publish`; then
`pnpm compile` / `pnpm build`. See `docs/runbook.md`.
