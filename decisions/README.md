# Decisions (ADRs)

Architecture Decision Records: accepted, durable decisions and why they were
made. They are project knowledge and stand on their own without any AI tooling.

## Conventions

- **Location:** `decisions/`
- **Naming:** `ADR-NNN-<kebab-case-title>.md`; next free number, never reused.
- **Sections:** Context, Decision, Options considered (optional), Rationale,
  Consequences. Metadata: Status, Date, Topic, RFC (when one exists).
- **Self-contained:** a reader with only the ADR understands the decision and
  why.
- **Immutable once accepted:** a later decision supersedes an ADR with a new
  ADR; the old one only gains `Status: Superseded by ADR-NNN`.

## When to write one

- An RFC ships: record its decision here and link both ways.
- A hard-to-reverse choice is made without an RFC (for example a new runtime
  `dependencies` entry, a hosting change, or a change to a layer rule).

Current-state behavior belongs in [`docs/`](../docs/); proposals belong in
[`rfcs/`](../rfcs/README.md).

## Index

| ADR                                                | Title                                                                 | Status   | RFC                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| [001](./ADR-001-ai-post-authoring-pipeline.md)     | Staged, human-led post authoring pipeline                             | Accepted | [001](../rfcs/archived/RFC-001-ai-post-authoring-pipeline.md)     |
| [002](./ADR-002-post-image-cls.md)                 | Post image CLS fix                                                    | Accepted | [002](../rfcs/archived/RFC-002-post-image-cls.md)                 |
| [003](./ADR-003-cloudflare-cdn.md)                 | Cloudflare CDN in front of GitHub Pages                               | Accepted | [003](../rfcs/archived/RFC-003-cloudflare-cdn.md)                 |
| [004](./ADR-004-post-asset-pipeline.md)            | Post asset pipeline: content-addressed images                         | Accepted | [004](../rfcs/archived/RFC-004-post-asset-pipeline.md)            |
| [005](./ADR-005-image-encode-concurrency.md)       | Compiler image encoding concurrency                                   | Accepted | [005](../rfcs/archived/RFC-005-image-encode-concurrency.md)       |
| [006](./ADR-006-compiler-pipeline-scheduling.md)   | Compiler pipeline: lazy Shiki grammars + scheduler                    | Accepted | [006](../rfcs/archived/RFC-006-compiler-pipeline-scheduling.md)   |
| [007](./ADR-007-display-typeface.md)               | Display typeface: undefined medium                                    | Accepted | [007](../rfcs/archived/RFC-007-display-typeface.md)               |
| [008](./ADR-008-agent-agnostic-knowledge-layer.md) | Agent-agnostic knowledge layer and guardrails                         | Accepted | [008](../rfcs/archived/RFC-008-agent-agnostic-knowledge-layer.md) |
| [009](./ADR-009-changesets-semver-releases.md)     | Semver releases with changesets                                       | Accepted | —                                                                 |
| [010](./ADR-010-design-system-foundations.md)      | Design system foundations: root, chrome, status, imagery, enforcement | Accepted | —                                                                 |
| [011](./ADR-011-build-caching.md)                  | Content-addressed build caching                                       | Accepted | [009](../rfcs/archived/RFC-009-build-caching.md)                  |
| [012](./ADR-012-release-gated-code-deploys.md)     | Release-gated code deploys, continuous posts                          | Accepted | —                                                                 |
| [013](./ADR-013-component-testing.md)              | Component testing with Vitest and Testing Library                     | Accepted | [011](../rfcs/archived/RFC-011-component-testing.md)              |
| [014](./ADR-014-paper-crt-light-theme.md)          | Paper-CRT light theme                                                 | Accepted | [010](../rfcs/archived/RFC-010-paper-crt-light-theme.md)          |
