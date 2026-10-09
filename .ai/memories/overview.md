---
description:
  What sudo-overclock is, its shape, and where every kind of knowledge lives.
  Read first on any task.
last-verified: 2026-10-09
---

# Overview

sudo-overclock is the author's personal engineering blog: a statically exported
Next.js site (GitHub Pages behind Cloudflare,
[ADR-003](../../decisions/ADR-003-cloudflare-cdn.md)) with a phosphor/CRT
identity. Human orientation is [README.md](../../README.md); do not restate it.

## Shape

- `src/app/` — composition root (routes only). `src/shared/` — domain-free
  primitives. `src/modules/blog/` — the only module: domain → application →
  infrastructure / presentation, plus `content/` (raw, drafts, compiled).
- `scripts/` — thin entrypoints (`compile.ts`, `author/*.ts`) over module code.
- Markdown in `content/raw/` is compiled at build time into
  `content/compiled/index.ts` and `public/posts/` (both generated, gitignored).

## Where knowledge lives

- Current behavior and rules: [`docs/`](../../docs/) — architecture, design
  language, components, authoring, runbook.
- Why: [`decisions/`](../../decisions/README.md) (ADRs). Proposals:
  [`rfcs/`](../../rfcs/README.md).
- AI layer (this directory's parent): orientation, skills, agents, templates.
  Placement rules: [`.ai/README.md`](../README.md).
