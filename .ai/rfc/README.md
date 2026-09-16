# RFCs (Proposals & Design Documents)

RFCs are version-controlled, numbered design documents for architectural,
structural, or cross-cutting changes. They capture the problem, the candidate
solutions, the trade-offs, the decision, and the follow-up work — so future
readers (humans and agents) understand **why** a design looks the way it does.

## Lifecycle

Tracked in the **Status** field of the document:

| Status        | Meaning                                                  |
| ------------- | -------------------------------------------------------- |
| `Draft`       | Being written; not yet reviewed.                         |
| `Proposed`    | Ready for review and decision.                           |
| `Accepted`    | The decision is agreed; implementation may begin.        |
| `Implemented` | Shipped. The decision is also recorded in `.ai/memory/`. |
| `Superseded`  | Replaced by a newer RFC or decision; kept for history.   |

## Conventions

- **Location:** `.ai/rfc/`
- **Naming:** `NNN-<kebab-case-title>.md` (e.g.
  `001-ai-post-authoring-pipeline.md`)
- **Numbering:** next free integer; never reuse.
- **Self-contained:** understandable on its own; link out for context only.
- **One decision per RFC:** split independent decisions into separate RFCs.

## RFC vs. spec

An **RFC** decides _why_ a design looks the way it does: it weighs viable
options and records the chosen one. Durable, numbered, version-controlled.

A **spec** defines _what_ one piece of work must do: objective, scope,
acceptance criteria, interfaces. Scoped to a single deliverable, local-only
(`.ai/specs/`), and disposed of once implemented.

They compose. Use an RFC when there are meaningful alternatives to decide
between; use a spec to specify the work under that decision. No real
alternatives → a spec alone is enough.

## Relationship to other `.ai/` directories

| Directory        | Version-controlled  | Purpose                                       |
| ---------------- | ------------------- | --------------------------------------------- |
| `.ai/rfc/`       | Yes                 | Proposals & design decisions with trade-offs. |
| `.ai/memory/`    | Yes                 | Decision log / historical context.            |
| `.ai/specs/`     | **No** (gitignored) | Local-only feature/task specs.                |
| `.ai/skills/`    | Yes                 | Agent-agnostic task workflows.                |
| `.ai/templates/` | Yes                 | Templates for `.ai/` documents.               |

## Workflow

1. **Draft** the RFC when a change is architectural, structural, or involves
   meaningful trade-offs. Start from `.ai/templates/rfc.md`.
2. **Review**; set **Status** to `Proposed`.
3. On agreement, set **Status** to `Accepted` and implement.
4. When shipped, set **Status** to `Implemented` and record the decision in
   `.ai/memory/` (self-contained, linking back to the RFC).
5. If a later RFC replaces it, mark the old one `Superseded` and cross-link.

## Index

| RFC                                      | Title                                         | Status      |
| ---------------------------------------- | --------------------------------------------- | ----------- |
| [001](001-ai-post-authoring-pipeline.md) | AI-Assisted Post Authoring Pipeline           | Draft       |
| [002](002-post-image-cls.md)             | Post Image Loading: Reserved Space + Skeleton | Implemented |
