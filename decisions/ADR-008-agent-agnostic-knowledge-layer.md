# ADR-008 — Agent-Agnostic Knowledge Layer and Guardrails

- **Status:** Accepted; the pre-push hook amended by
  [ADR-011](./ADR-011-build-caching.md) (wireit tasks)
- **Date:** 2026-10-09
- **Topic:** repository / process
- **RFC:** [RFC-008](../rfcs/archived/RFC-008-agent-agnostic-knowledge-layer.md)

## Context

Project knowledge and AI tooling were mixed inside `.ai/`: every RFC, every
accepted decision, the post-authoring contract, and the post templates the
authoring CLI read at runtime. Deleting `.ai/` would have lost the decision
history and broken `pnpm author:new`. Decisions were written up to three times
(RFC, a history-style memory entry, and `docs/`). Only `AGENTS.md` existed as an
entry point, skills were not discoverable by tools, no precedence order resolved
conflicting sources, and the only git guardrail was "do not commit unless
asked".

## Decision

1. **Project knowledge stands alone.** `docs/` holds the current behavior,
   rules, and procedures (including the authoring contract); `decisions/` holds
   ADRs; `rfcs/active/` and `rfcs/archived/` hold proposals. Post templates live
   in `src/modules/blog/infrastructure/authoring/templates/`. Runtime code never
   reads from `.ai/`.
2. **The AI layer only consumes it.** `.ai/` holds present-state memories
   (`description` + `last-verified` frontmatter, linking out), committed working
   memories with a promote-or-delete lifecycle, skills in the open `SKILL.md`
   format, role agents (documenter, implementer, reviewer, editor), templates,
   and gitignored local specs. Placement rules and test questions are in
   `.ai/README.md`.
3. **Agent-agnostic.** `AGENTS.md` is the only instruction source. Adapters are
   pointers only: `CLAUDE.md` (`@AGENTS.md`) and symlinks `.claude/skills`,
   `.claude/agents`, `.opencode/skills`, `.opencode/agents`, `.agents/skills`
   into `.ai/`.
4. **Guardrails.** A precedence order (author > code/config > `docs/` >
   `decisions/` > accepted RFCs > memories > working memories > assumptions); a
   lightweight approval gate (agents never stage, commit, or push unless the
   author asks; the reviewer agent runs on request); a knowledge-maintenance
   table and a drift-sync skill; no secrets, no fabrication; an ADR for every
   new runtime `dependencies` entry; a versioned pre-push hook that lints and
   tests (originally compiling only when compiled content was missing; since
   [ADR-011](./ADR-011-build-caching.md) it runs the cached wireit tasks); a PR
   template with a definition of done.

## Rationale

Keeping everything in `.ai/` fails the "stands alone without AI tooling" test
and keeps the duplication. Nesting proposals and decisions under `docs/` would
diverge from the layout the author uses across repositories and mix
current-state docs with historical records. The root-level layout separates
_current contract_, _why_, and _proposal_, lets any tool work from one source,
and lets memories shrink to orientation. A mandatory two-step review gate was
rejected as overhead for a solo repository.

## Consequences

- Removing every AI tool leaves the site, the CLI, and all decisions intact.
- Each decision has one canonical page (its ADR), linked from `docs/` and
  memories; RFCs are archived once they ship.
- More upkeep per change: drift sync, `last-verified` dates, and an ADR when an
  RFC ships.
- Symlinked adapters need `core.symlinks` on Windows.
- `pnpm install` sets `core.hooksPath=.githooks` through the `prepare` script.
