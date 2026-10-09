---
name: write-an-rfc
description: Use when a change is architectural, structural, cross-cutting, or has meaningful alternatives. Decides whether an RFC, an ADR, or only a spec is needed, and carries an RFC from draft to ADR to archive.
---

# write-an-rfc

## Prerequisites

- [`rfcs/README.md`](../../../rfcs/README.md) (lifecycle) and
  [`decisions/README.md`](../../../decisions/README.md) (ADR conventions).

## Workflow

1. Route the change:
   - real alternatives to weigh → **RFC** in `rfcs/active/`;
   - a hard-to-reverse choice without alternatives worth an RFC (a new runtime
     dependency, a hosting change, a layer-rule change) → **ADR** directly;
   - otherwise → a **spec** in `.ai/specs/` (local, gitignored) is enough.
2. Draft `rfcs/active/RFC-NNN-<kebab>.md` from
   [`.ai/templates/rfc.md`](../../templates/rfc.md) with the next free number.
   Ground the Context in measurements and file references, not assertions. Add a
   row to the index in `rfcs/README.md`.
3. One decision per RFC. Split independent decisions.
4. Status `Draft` → `Proposed` when ready; the author moves it to `Accepted`. Do
   not implement before `Accepted`.
5. On ship: fold current-state facts into `docs/`, write
   `decisions/ADR-NNN-<kebab>.md` from
   [`.ai/templates/adr.md`](../../templates/adr.md), cross-link RFC ↔ ADR, set
   the RFC to `Implemented`, move it to `rfcs/archived/`, update both indexes.

## Constraints

- Never fabricate numbers, benchmarks, or sources; unknowns become open
  questions.
- An RFC that is not `Accepted` never overrides `docs/` or an ADR.
- Accepted ADRs are not rewritten; a new ADR supersedes them.

## Expected output

The RFC (or ADR), updated indexes, and a list of open questions for the author.

## References

- [documenter agent](../../agents/documenter.md),
  [`.ai/templates/spec.md`](../../templates/spec.md)
