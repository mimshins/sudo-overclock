---
description:
  Commands, gates, and the change workflow. Read before starting work and before
  handing off.
last-verified: 2026-10-09
---

# Development workflow

Commands and troubleshooting: [`docs/runbook.md`](../../docs/runbook.md). The
contribution flow: [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

- Route the change: architectural or trade-off → spec + RFC
  ([write-an-rfc](../skills/write-an-rfc/SKILL.md)); otherwise implement
  directly.
- Verify: `pnpm check:lint` + `pnpm test`; `pnpm build` when the compiler,
  content, or app changed.
- `pnpm install` sets `core.hooksPath=.githooks`; `pre-push` compiles if the
  compiled content is missing, then lints and tests. Never bypass with
  `--no-verify` unless the author asks.
- Before handing off:
  [knowledge-drift-sync](../skills/knowledge-drift-sync/SKILL.md); resolve
  working memories tied to the change.
- **Approval gate:** never `git add`, `commit`, or `push` unless the author
  asks. Stop after verification and hand over the diff. The reviewer agent runs
  on request.
