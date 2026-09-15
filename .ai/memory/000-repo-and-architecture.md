# 000 — Repository & Architecture

sudo-overclock is a statically generated engineering blog. Content compilation
is separated from the application layer: markdown in, structured TS out, Next.js
renders it at build time.

## Shape

```
src/
  app/        # Composition root — Next.js App Router routes only
  shared/     # Cross-cutting primitives, no domain knowledge
  modules/
    blog/
      domain/          # Pure types (Post, PostSummary, PostFrontmatter, TocItem)
      application/     # Use cases (createBlogServices) + ports (ContentRepository)
      infrastructure/  # Compiler, compiled-content adapter, authoring CLI
      presentation/    # React components
      content/         # raw/ (source) + compiled/ (generated, gitignored)
        drafts/        # In-progress posts; excluded from the build
```

The authoritative architecture guide lives in `docs/architecture.md`. The visual
identity lives in `docs/design-language.md`.

## Key decisions

- **DDD/Clean layering.** Inner layers never import outer ones. Peer modules
  talk through `application/ports/`, never through each other's layers. Enforced
  by `oxlint` `no-restricted-imports` (see `oxlint.config.ts`).
- **Two-stage content pipeline.** `content/raw/**` is compiled by
  `infrastructure/compiler/` into `content/compiled/index.ts`. `pnpm build` runs
  `pnpm compile` via the `prebuild` hook.
- **Drafts are separate from raw.** `content/drafts/<slug>/` sits beside
  `content/raw/`. The compiler globs only `raw/**`, so drafts are excluded for
  free — no compiler change required.
- **AI knowledge system.** `.ai/memory/` (decisions), `.ai/skills/` (workflows),
  `.ai/rfc/` (proposals), `.ai/specs/` (local-only specs, gitignored),
  `.ai/templates/`. See `AGENTS.md`.
