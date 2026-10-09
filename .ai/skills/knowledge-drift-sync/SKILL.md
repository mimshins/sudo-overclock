---
name: knowledge-drift-sync
description: Use before finishing any non-trivial change. Reconciles code with docs/, decisions/, rfcs/, memories, and the PR checklist so no knowledge is left stale.
---

# knowledge-drift-sync

## Prerequisites

- The change under review: `git diff` (working tree) or `git diff main...HEAD`
  (branch).

## Workflow

1. List what changed in behavior or structure: layer rules, module shape,
   compiler stages, authoring CLI, frontmatter, components, tokens, scripts,
   CI/deploy, dependencies.
2. For each, find its canonical home in the knowledge-maintenance table in
   [`AGENTS.md`](../../../AGENTS.md#knowledge-maintenance) and compare:
   - code changed behavior → update the doc in the same change;
   - a doc changed → the code implements it, or the doc change is reverted;
   - a lint-enforced rule changed → `oxlint.config.ts` and
     `docs/architecture.md` agree.
3. Decisions: an RFC that shipped gets an ADR in `decisions/`, Status
   `Implemented`, and moves to `rfcs/archived/`; both indexes are updated. A new
   runtime `dependencies` entry has an ADR.
4. Releases: code, public-asset, build-config, or dependency changes carry a
   changeset with the right bump (`pnpm changesets:check`).
5. Memories: update `last-verified` on each memory you re-checked; fix or delete
   stale statements. Memories state the present and link out.
6. Resolve working memories in `.ai/memories/working/` tied to this change
   (promote durable parts, delete the file).
7. Links: every relative link in changed `*.md` files resolves.
8. Report what was synchronized, or state "no drift" with the evidence.

## Constraints

- Follow the precedence order in `AGENTS.md`; when code and docs disagree and
  the intent is unclear, ask — do not guess.
- Fix the lower-precedence source or flag it; never silently pick one.

## Useful commands

```sh
git diff --stat main...HEAD
pnpm check:lint && pnpm test
pnpm build   # when the compiler, content, or app changed
```

## Expected output

A drift report plus the doc/code changes, in the same change.

## References

- [`.ai/README.md`](../../README.md) (placement rules),
  [reviewer agent](../../agents/reviewer.md),
  [ADR-008](../../../decisions/ADR-008-agent-agnostic-knowledge-layer.md)
