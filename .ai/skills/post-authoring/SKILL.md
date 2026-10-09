---
name: post-authoring
description: Use when helping the author write a blog post — expanding a brief, building a research pack, critiquing an outline, running the editorial pass, or auditing preflight. Runs one assisted stage of the staged pipeline; never writes the author's prose and never publishes.
---

# post-authoring

## Prerequisites

- The pipeline contract — stages, gates, `stage:` values, workspace layout, and
  rules — is
  [`docs/authoring.md#writing-pipeline`](../../../docs/authoring.md#writing-pipeline).
  Read it first; this skill implements it and never overrides it.
- A draft workspace at `src/modules/blog/content/drafts/<slug>/`, scaffolded by
  `pnpm author:new <slug>`.

## Workflow

1. Read `post.md` frontmatter `stage` and confirm the previous gate in
   `docs/authoring.md` is met. If it is not, stop and say what is missing.
2. Load the prompt for the stage and follow it exactly:
   - Brief → [`stages/brief.md`](./stages/brief.md)
   - Research → [`stages/research.md`](./stages/research.md)
   - Outline critique →
     [`stages/outline-critique.md`](./stages/outline-critique.md)
   - Editorial → [`stages/editorial.md`](./stages/editorial.md)
   - Preflight → [`stages/preflight.md`](./stages/preflight.md)
3. Write only the artifact named in that stage's output contract.
4. Report what was produced and what the author must decide next.

Stages 0, 4, 6, and 8 (seed, draft, resolve, publish) belong to the author;
there is no prompt for them.

Every stage prompt declares **Role**, **Inputs**, **Instructions**, **Output
contract**, and **Guardrails**. The editorial standard and the preflight
checklist they apply are in
[`docs/authoring.md`](../../../docs/authoring.md#editorial-standard).

## Constraints

- Never edit `post.md` in place during editorial; write a snapshot plus a diff.
- Never write to `content/raw/`, `content/compiled/`, or `public/`; publishing
  is the author's `pnpm author:publish`.
- Never invent facts or sources; flag them `[unverified]`.
- Keep the author's voice; simplify, do not homogenize.

## Useful commands

```sh
pnpm author:new <slug>        # scaffold the workspace
pnpm author:preflight <slug>  # mechanical checks for stage 7
```

## Expected output

The single stage artifact (for example `brief.md` or
`snapshots/editorial-<date>.md` + `.diff.md`) and a short hand-off note.

## References

- [`docs/authoring.md`](../../../docs/authoring.md),
  [ADR-001](../../../decisions/ADR-001-ai-post-authoring-pipeline.md),
  [editor agent](../../agents/editor.md)
