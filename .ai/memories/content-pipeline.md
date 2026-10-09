---
description:
  How markdown becomes pages and where generated output lands. Read before
  touching the compiler, authoring CLI, or post assets.
last-verified: 2026-10-09
---

# Content pipeline (agent context)

Contract:
[`docs/architecture.md#content-pipeline`](../../docs/architecture.md#content-pipeline)
and [`docs/authoring.md`](../../docs/authoring.md). Orientation:

- `pnpm compile` (`scripts/compile.ts` → `infrastructure/compiler/compile.ts`)
  wipes and regenerates `public/posts/` and `content/compiled/` on every run.
  `pnpm build` runs it through `prebuild`.
- Type-aware `oxlint` imports the compiled module, so lint needs a prior compile
  (CI compiles first).
- Image encoding (sharp) dominates compile time.
- Authoring CLI: `infrastructure/authoring/` behind `scripts/author/*.ts`;
  templates in `infrastructure/authoring/templates/`.
- Troubleshooting lives in [`docs/runbook.md`](../../docs/runbook.md).
