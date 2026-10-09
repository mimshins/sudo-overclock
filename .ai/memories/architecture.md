---
description:
  Layering, boundaries, and decisions an agent must not "fix". Read before
  changing structure, adding files, or moving code.
last-verified: 2026-10-09
---

# Architecture (agent context)

The contract is [`docs/architecture.md`](../../docs/architecture.md); the
boundaries are enforced by `oxlint.config.ts` (`no-restricted-imports` per
folder, `import/no-cycle`). This note is orientation around them.

## Mental model

- `app/` composes pages from `modules/*/presentation/` and `@repo/shared/*`
  only. It never reaches into a module's domain, application, or infrastructure.
- Ports live in `application/ports/`; adapters in `infrastructure/`; the
  composition root wires them. `presentation/` never imports its own
  `infrastructure/` except through the module's `*-module.ts` / `*-provider.tsx`
  composition file.
- Imports: relative inside a module; aliases only inside `src/shared/**`;
  aliases across modules.

## Decisions not to "fix"

- Drafts sit beside `raw/` and are excluded because the compiler globs `raw/**`
  only ([ADR-001](../../decisions/ADR-001-ai-post-authoring-pipeline.md)) — do
  not add draft filtering to the compiler.
- Image filenames hash the **source** bytes + transform parameters, not the
  encoded output, so names are stable across macOS and CI
  ([ADR-004](../../decisions/ADR-004-post-asset-pipeline.md)).
- Encoding concurrency and post fan-out are deliberately bounded
  ([ADR-005](../../decisions/ADR-005-image-encode-concurrency.md),
  [ADR-006](../../decisions/ADR-006-compiler-pipeline-scheduling.md)); Shiki
  grammars load lazily.
- Images carry intrinsic `width`/`height` and a skeleton to avoid CLS
  ([ADR-002](../../decisions/ADR-002-post-image-cls.md)).
- The display face is a pixel font used only at 10px-grid sizes and never subset
  or modified ([ADR-007](../../decisions/ADR-007-display-typeface.md)).
- Post templates live in the authoring module, not `.ai/`, so the CLI works
  without AI tooling
  ([ADR-008](../../decisions/ADR-008-agent-agnostic-knowledge-layer.md)).
