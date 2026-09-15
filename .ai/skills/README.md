# Skills

Agent- and model-agnostic task skills. Each skill is plain markdown so any
assistant (Codex, Claude, Kiro, opencode, …) can load it. `AGENTS.md` is the
central index that points here.

## Index

| Skill                                             | Purpose                                                 |
| ------------------------------------------------- | ------------------------------------------------------- |
| [`post-authoring/`](./post-authoring/pipeline.md) | The human/AI pipeline for writing and publishing a post |

## Anatomy of a skill

A skill is a directory containing a `pipeline.md` (or `<skill>.md`) entrypoint
plus supporting files. Stage prompts live under `stages/`, reusable checklists
under `checklists/`. Every stage prompt declares:

- **Role** — who the assistant is acting as.
- **Inputs** — the files it reads.
- **Instructions** — what to do.
- **Output contract** — the exact file(s) it writes and their shape.
- **Guardrails** — the hard limits it must not cross.

## Adding a skill

1. Create `.ai/skills/<kebab-name>/`.
2. Write `<kebab-name>.md` (or `pipeline.md`) with the sections above.
3. Add a row to the index table.
4. Link it from `AGENTS.md` if it is a mandatory workflow.
