# 001 — AI-Assisted Post Authoring Pipeline

- **Status:** Draft
- **Date:** 2026-09-15
- **Supersedes:** —
- **Superseded by:** —

## Context

Posts are currently written ad hoc and published by hand: drop a markdown file
in `content/raw/<slug>/`, run `pnpm compile`, push. There is no defined process
for the writing itself, and no place for AI assistance to plug in without
risking silent rewrites of the author's voice.

We want a healthy pipeline that keeps the human in charge while letting AI help
with the mechanical and editorial work — and we want the process to be
agent-agnostic so Codex, Claude, Kiro, or opencode can all run it from the same
source of truth.

## Options

### Option A — Undocumented, prompt-per-session

Keep a few prompts in a scratch file and paste them as needed.

- **Pros:** zero structure, instant.
- **Cons:** no trail, no consistency, no shared vocabulary, nothing to onboard
  an agent with.

### Option B — Tool-specific agent config

Define opencode skills/subagents (or equivalent) as the process.

- **Pros:** tight editor integration.
- **Cons:** locks the process to one tool; the actual workflow lives in config
  files instead of readable docs.

### Option C — Staged markdown pipeline under `.ai/`

A nine-stage, human-led workflow where every stage is a plain markdown artifact
in the repo. Canonical prompts and checklists live in `.ai/skills/`; templates
in `.ai/templates/`; `AGENTS.md` is the index. Drafts live in
`content/drafts/<slug>/` so the compiler ignores them. Mechanical steps are
exposed as `pnpm author:new|preflight|publish`.

- **Pros:** tool-agnostic; versioned trail; inspectable; drafts excluded from
  the build for free; mechanical checks are testable.
- **Cons:** more ceremony than ad-hoc writing; a new directory and CLI to
  maintain.

## Decision

Adopt **Option C**.

## Consequences

- `content/drafts/<slug>/` becomes the authoring workspace; `post.md` carries a
  `stage:` frontmatter field.
- `.ai/` gains `memory/`, `skills/`, `rfc/`, `specs/` (gitignored),
  `templates/`.
- `AGENTS.md` is rewritten as an index with mandatory actions.
- `docs/architecture.md`, `docs/design-language.md`, and `docs/runbook.md` are
  split out of `AGENTS.md`.
- The assistant proposes diffs and inline notes; it never edits `post.md` during
  editorial, and never publishes.
- Follow-up: seed `.ai/memory/` entries as real posts are written.
