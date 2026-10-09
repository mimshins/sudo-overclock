# .ai — agent knowledge layer

Map of the AI-oriented layer. It **consumes and links to** the project knowledge
(`docs/`, `decisions/`, `rfcs/`, `README.md`, `CONTRIBUTING.md`) and never
duplicates it. If every AI tool and this directory were removed, the site, the
authoring CLI, and every decision would still stand on their own
([ADR-008](../decisions/ADR-008-agent-agnostic-knowledge-layer.md)).

Entry point for agents: [`AGENTS.md`](../AGENTS.md) — the only instruction
source. Tool adapters (`CLAUDE.md`, `.claude/skills`, `.claude/agents`,
`.opencode/skills`, `.opencode/agents`, `.agents/skills`) are pointers into this
layer and never contain content.

## Placement rules

| Location                | Holds                                               | Test question                                                        |
| ----------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| `docs/`                 | current behavior, rules, procedures                 | Would a human need it with no AI tooling?                            |
| `decisions/`            | accepted decisions and why (ADRs)                   | Does it record _why_ something was decided?                          |
| `rfcs/`                 | proposals (`active/`) and closed ones (`archived/`) | Is it proposed, not yet decided?                                     |
| `.ai/memories/`         | short, present-state orientation for agents         | Does it help an agent decide, without being a contract or procedure? |
| `.ai/memories/working/` | committed in-flight context                         | Is it still unresolved?                                              |
| `.ai/skills/`           | how to perform a reusable class of task             | Is it a repeatable workflow?                                         |
| `.ai/agents/`           | role-specific behavior and boundaries               | Does it apply to one role only?                                      |
| `.ai/templates/`        | templates for specs, RFCs, ADRs, and this layer     | —                                                                    |
| `.ai/specs/`            | local task specs (**gitignored**, never committed)  | Is it one deliverable's working spec?                                |

Rules: one source of truth — link, don't copy. Memories describe the present,
not history (history is ADRs, RFCs, and git). No secrets, tokens, or private
hostnames. Runtime code never reads from `.ai/`.

**Precedence** when sources disagree: the author's explicit instructions >
code/config > `docs/` > `decisions/` > accepted `rfcs/` > `.ai/memories/` >
working memories > agent assumptions. Fix or flag the lower source and say so in
your report.

## Index

Load only what the task needs.

### Memories (`memories/`)

- [`overview.md`](./memories/overview.md) — what the project is and where
  knowledge lives. Read first.
- [`architecture.md`](./memories/architecture.md) — layering and decisions not
  to "fix". Before changing structure.
- [`conventions.md`](./memories/conventions.md) — naming, imports, styling,
  tests. Before writing code.
- [`content-pipeline.md`](./memories/content-pipeline.md) — compiler and
  authoring CLI orientation. Before touching content tooling.
- [`development-workflow.md`](./memories/development-workflow.md) — routing,
  gates, hooks, approval. Before starting and before handing off.
- [`working/README.md`](./memories/working/README.md) — lifecycle for in-flight
  memories.

### Skills (`skills/`)

- [`post-authoring`](./skills/post-authoring/SKILL.md) — run one assisted stage
  of the writing pipeline.
- [`write-an-rfc`](./skills/write-an-rfc/SKILL.md) — route RFC vs. ADR vs. spec;
  RFC → ADR → archive.
- [`knowledge-drift-sync`](./skills/knowledge-drift-sync/SKILL.md) — reconcile
  code and knowledge before handing off.

### Agents (`agents/`)

Typical flow: documenter (spec/RFC) → implementer → **author review** → reviewer
(on request) → commit (only when the author asks). Posts: editor ↔ author.

- [`documenter.md`](./agents/documenter.md) — requests → specs, RFCs, ADRs;
  keeps knowledge in sync.
- [`implementer.md`](./agents/implementer.md) — code + tests to the spec; stops
  for review.
- [`reviewer.md`](./agents/reviewer.md) — architecture and drift check on
  request.
- [`editor.md`](./agents/editor.md) — lead editor for posts; never takes over
  the voice.

How to invoke them in each tool:
[CONTRIBUTING.md](../CONTRIBUTING.md#working-with-ai-agents).

### Templates (`templates/`)

[`spec.md`](./templates/spec.md), [`rfc.md`](./templates/rfc.md),
[`adr.md`](./templates/adr.md), [`memory.md`](./templates/memory.md),
[`working-memory.md`](./templates/working-memory.md),
[`skill.md`](./templates/skill.md), [`agent.md`](./templates/agent.md).
