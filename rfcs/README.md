# RFCs (Proposals & Design Documents)

RFCs are version-controlled, numbered design documents for architectural,
structural, or cross-cutting changes with meaningful alternatives. They capture
the problem, the candidate solutions, the trade-offs, and the decision — so
future readers understand **why** a design looks the way it does. They are
project knowledge and stand on their own without any AI tooling.

## Lifecycle

Tracked in the **Status** field and by directory:

| Status        | Directory   | Meaning                                           |
| ------------- | ----------- | ------------------------------------------------- |
| `Draft`       | `active/`   | Being written; not yet reviewed.                  |
| `Proposed`    | `active/`   | Ready for review and decision.                    |
| `Accepted`    | `active/`   | The decision is agreed; implementation may begin. |
| `Implemented` | `archived/` | Shipped; the decision is recorded as an ADR.      |
| `Rejected`    | `archived/` | Not adopted; kept so the "why not" is not lost.   |
| `Superseded`  | `archived/` | Replaced by a newer RFC or ADR; kept for history. |

An RFC that is not `Accepted` never overrides `docs/` or an accepted ADR.

## Conventions

- **Location:** `rfcs/active/` and `rfcs/archived/`
- **Naming:** `RFC-NNN-<kebab-case-title>.md`; next free number, never reused.
- **Sections:** metadata (Status, Date, Supersedes, Superseded by), Context,
  Options (each with pros and cons), Decision, Consequences.
- **Self-contained:** understandable on its own; link out for context only.
- **One decision per RFC:** split independent decisions into separate RFCs.

## RFC vs. ADR vs. spec

- An **RFC** weighs viable options before a decision. Durable, numbered.
- An **ADR** ([`decisions/`](../decisions/README.md)) records the accepted
  decision and why, in a self-contained page. Every implemented RFC has one.
- A **spec** defines _what_ one piece of work must do (objective, scope,
  acceptance criteria). Specs are local working documents (`.ai/specs/`,
  gitignored) and are disposed of once implemented; their durable outcome lands
  in `docs/` and, where a decision was made, an ADR.
- The current behavior itself is documented in [`docs/`](../docs/).

No real alternatives → a spec alone is enough.

## Workflow

1. **Draft** in `active/` when a change is architectural, structural, or
   involves meaningful trade-offs.
2. **Review**; set **Status** to `Proposed`.
3. On agreement, set **Status** to `Accepted` and implement.
4. When shipped: fold the current-state facts into `docs/`, record an ADR, set
   **Status** to `Implemented`, and move the file to `archived/`.
5. If a later RFC replaces it, mark the old one `Superseded` and cross-link.

## Index

| RFC                                                         | Title                                                              | Status      |
| ----------------------------------------------------------- | ------------------------------------------------------------------ | ----------- |
| [001](./archived/RFC-001-ai-post-authoring-pipeline.md)     | AI-Assisted Post Authoring Pipeline                                | Implemented |
| [002](./archived/RFC-002-post-image-cls.md)                 | Post Image Loading: Reserved Space + Skeleton                      | Implemented |
| [003](./archived/RFC-003-cloudflare-cdn.md)                 | Cloudflare CDN in front of GitHub Pages                            | Implemented |
| [004](./archived/RFC-004-post-asset-pipeline.md)            | Post Asset Pipeline: Content-Addressed, Optimized Images           | Implemented |
| [005](./archived/RFC-005-image-encode-concurrency.md)       | Compiler Image Encoding Concurrency                                | Implemented |
| [006](./archived/RFC-006-compiler-pipeline-scheduling.md)   | Compiler Pipeline: Lazy Shiki Grammars + Bounded Scheduler         | Implemented |
| [007](./archived/RFC-007-display-typeface.md)               | Display Typeface: undefined medium for Wordmark & Display Headings | Implemented |
| [008](./archived/RFC-008-agent-agnostic-knowledge-layer.md) | Agent-Agnostic Knowledge Layer and Guardrails                      | Implemented |
| [009](./archived/RFC-009-build-caching.md)                  | Content-Addressed Build Caching: Compiler, Tasks, and CI           | Implemented |
| [010](./active/RFC-010-paper-crt-light-theme.md)            | Paper-CRT Light Theme                                              | Accepted    |
| [011](./archived/RFC-011-component-testing.md)              | Component Testing with Vitest and Testing Library                  | Implemented |
