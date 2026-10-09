# RFC-008 — Agent-Agnostic Knowledge Layer and Guardrails

- **Status:** Implemented
- **Date:** 2026-10-09
- **Supersedes:** [RFC-001](./RFC-001-ai-post-authoring-pipeline.md)
  (knowledge-layer layout only; the staged pipeline stands)
- **Superseded by:** —

## Context

The repository mixes two kinds of knowledge inside `.ai/`:

- **Project knowledge** a human needs with no AI tooling — every RFC
  (`.ai/rfc/`), every accepted decision (`.ai/memory/<topic>/`), the
  post-authoring stages and gates (`.ai/skills/post-authoring/pipeline.md`,
  linked as the source of truth from `docs/authoring.md`), and the post
  scaffolding templates that `pnpm author:new` reads at runtime
  (`.ai/templates/`, via `infrastructure/authoring/context.ts`).
- **AI knowledge** that only helps an agent orient or perform a task.

Consequences today: deleting `.ai/` would lose the decision history and break
the authoring CLI. Decisions are written up to three times (RFC, memory entry,
`docs/`), and the memory entries are history-shaped ADRs, not present-state
orientation. Only `AGENTS.md` exists as an entry point: no tool adapters, skills
lack the discoverable `SKILL.md` + frontmatter shape, there is no precedence
order for conflicting sources, and the only guardrail on git is "do not commit
unless asked".

`se-backend` solved the same problem (its ADR-007 and ADR-009): root-level
project knowledge that stands alone, an `.ai/` layer that only links to it,
pointer-only adapters, and explicit guardrails.

## Options

### Option A — Keep everything in `.ai/`, add adapters and guardrails

- **Pros:** smallest diff; no link migration.
- **Cons:** fails the "stands alone without AI tooling" test; decisions remain
  invisible to non-AI readers; duplication persists; the CLI keeps depending on
  the AI layer.

### Option B — Project knowledge under `docs/` (`docs/rfcs/`, `docs/decisions/`)

- **Pros:** tidy root; one human-knowledge directory.
- **Cons:** diverges from the reference layout used across the author's other
  repositories, so agents and the author context-switch between conventions;
  mixes current-state docs with historical records in one tree.

### Option C — Root-level `rfcs/` and `decisions/`, `docs/` for current state, `.ai/` consumes (se-backend layout)

- **Pros:** passes the stand-alone test; one convention across repositories;
  clear separation of _current contract_ (`docs/`), _why_ (`decisions/`), and
  _proposal_ (`rfcs/`); memories shrink to orientation; adapters make any tool
  work unchanged.
- **Cons:** larger one-time migration with link fixes; two more root
  directories; symlinks need `core.symlinks` on Windows.

## Decision

**Option C.** Move RFCs to `rfcs/{active,archived}/` and convert the six
decision entries to ADRs in `decisions/` (numbered to match their RFC). Fold the
authoring contract into `docs/authoring.md` and move post templates into the
authoring module. Reshape `.ai/` into memories (present-state, `last-verified`),
working memories, `SKILL.md` skills, role agents (implementer, reviewer,
documenter, editor), and AI-only templates. Add `CLAUDE.md` (`@AGENTS.md`) and
symlink adapters for Claude Code, OpenCode, and `.agents`.

Guardrails: a precedence order; a **lightweight** approval gate (agents never
stage, commit, or push unless asked, and stop with the diff after verification;
the reviewer agent is opt-in, not a mandatory second gate — a two-step gate is
overhead for a solo repository); a knowledge-maintenance table plus a drift-sync
skill; no-secrets and no-fabrication rules; a versioned pre-push hook and a PR
template with a definition of done.

**Amended on acceptance (2026-10-09, by the author):** RFC-001 is marked
Implemented with a backfilled ADR-001; a new runtime `dependencies` entry
requires an ADR; the pre-push hook compiles only when compiled content is
missing. The design-system work requested at the same time (a designer role,
`docs/design-system.md`, a `design-a-feature` skill) is recorded separately in
[ADR-010](../../decisions/ADR-010-design-system-foundations.md).

## Consequences

- Removing all AI tooling leaves the site, the CLI, and every decision intact.
- Each decision has one canonical home (ADR), linked from `docs/` and memories.
- Any tool that reads `AGENTS.md` or the open skills layout works without
  per-tool content.
- More process per change: drift sync, memory `last-verified` upkeep, and an ADR
  when an RFC ships.
- Recorded in
  [ADR-008](../../decisions/ADR-008-agent-agnostic-knowledge-layer.md).
