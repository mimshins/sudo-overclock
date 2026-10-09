# ADR-001 — Staged, Human-Led Post Authoring Pipeline

- **Status:** Accepted
- **Date:** 2026-09-15
- **Topic:** blog / authoring
- **RFC:** [RFC-001](../rfcs/archived/RFC-001-ai-post-authoring-pipeline.md)

## Context

Posts were written ad hoc and published by hand: drop a markdown file in
`content/raw/<slug>/`, run `pnpm compile`, push. There was no defined writing
process and no place for AI assistance to plug in without risking silent
rewrites of the author's voice. The process also had to work with any AI tool,
not one vendor's agent configuration.

## Decision

Writing follows a nine-stage, human-led pipeline (seed → brief → research →
outline → draft → editorial → resolve → preflight → publish). Every stage leaves
a plain markdown artifact in `src/modules/blog/content/drafts/<slug>/`, and
`post.md` carries a `stage:` frontmatter field. Drafts sit beside `raw/`, so the
compiler (which globs `raw/**` only) excludes them without any change. The
mechanical steps are CLI commands: `pnpm author:new`, `pnpm author:preflight`,
`pnpm author:publish`.

The author owns voice, facts, and every final decision. AI assistance is limited
to the brief, research, outline critique, editorial, and preflight stages; it
proposes diffs and inline notes, never edits `post.md` during editorial, flags
unsupported claims as `[unverified]`, and never publishes.

The contract (stages, gates, workspace, rules) lives in
[`docs/authoring.md`](../docs/authoring.md); the AI stage prompts are tooling on
top of it.

## Rationale

A prompt-per-session approach leaves no trail and no shared vocabulary.
Tool-specific agent configuration locks the process to one assistant and hides
the workflow in config files. Plain markdown stages are tool-agnostic,
versioned, inspectable, and let the mechanical checks be tested, at the cost of
more ceremony than ad-hoc writing and a CLI to maintain.

## Consequences

- Drafts never reach the build; publishing is a human-run command.
- Each stage is gated: a stage is complete when its artifact exists and the next
  stage has what it needs.
- Where the AI layer itself lives (`.ai/`) was later revised by
  [ADR-008](./ADR-008-agent-agnostic-knowledge-layer.md); the pipeline is
  unchanged.
