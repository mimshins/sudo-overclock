# AGENTS.md

Central onboarding index for AI agents and mandatory action contract for
sudo-overclock — a statically generated engineering blog. Read this first, then
follow the links; do not duplicate their contents here.

## Spec-Driven Development (AI Agent Workflow)

For an **architectural or design change** — one that alters module boundaries,
the content pipeline, cross-cutting patterns, major dependencies, or otherwise
involves meaningful design trade-offs — the following is mandatory:

1. **Require a spec.** Ask the author to provide a specification first.
2. **Use the template.** Direct them to copy `.ai/templates/spec.md`, fill it
   out, and paste it back.
3. **Clarify.** Ask follow-up questions until ambiguities are resolved.
4. **Task breakdown.** Break the agreed spec into ordered, actionable tasks.
5. **Confirm and execute.** Get explicit confirmation before writing any code.

Routine implementation, small changes (copy, styling, layout), and bug fixes do
not require a spec unless they constitute an architectural change.

## Mandatory Actions

- **Follow the authoring pipeline.** All posts go through
  [`.ai/skills/post-authoring/pipeline.md`](./.ai/skills/post-authoring/pipeline.md).
  Drafts live in `content/drafts/<slug>/`; never write to `content/raw/`,
  `content/compiled/`, or `public/` by hand. During editorial, **propose diffs
  and inline notes — never silently rewrite the author's prose**, and never
  publish.
- **Record memory.** When you make a structural, architectural, or business
  decision, write a self-contained numbered entry under `.ai/memory/<topic>/`
  (start from `.ai/templates/memory-entry.md`). A reader with only that file
  must understand the decision and why.
- **Write an RFC before implementing trade-off decisions.** For proposals with
  meaningful alternatives, draft `.ai/rfc/NNN-<kebab>.md` from
  `.ai/templates/rfc.md` before coding. When it ships, set its status to
  `Implemented` and record the decision in `.ai/memory/`, cross-linked.
- **Keep docs in sync.** If a change alters behavior, architecture, or a public
  workflow, update the relevant file under `docs/` **and** this index in the
  same change. A change that leaves docs stale is incomplete.
- **Verify before finishing.** Run `pnpm check:lint` and `pnpm test`; run
  `pnpm compile` / `pnpm build` when the compiler or content is touched.
- **Do not commit** unless explicitly asked.

## Where Things Live

| Topic                                               | Location                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| Architecture, module boundaries, naming, DI, tokens | [`docs/architecture.md`](./docs/architecture.md)                        |
| Visual identity, phosphor/CRT design language       | [`docs/design-language.md`](./docs/design-language.md)                  |
| Content authoring (writing + publishing mechanics)  | [`docs/authoring.md`](./docs/authoring.md)                              |
| Components                                          | [`docs/components.md`](./docs/components.md)                            |
| Commands, local workflow, troubleshooting, release  | [`docs/runbook.md`](./docs/runbook.md)                                  |
| Post authoring workflow                             | [`.ai/skills/post-authoring/`](./.ai/skills/post-authoring/pipeline.md) |
| Decisions & historical context                      | [`.ai/memory/`](./.ai/memory/000-repo-and-architecture.md)              |
| Proposals with trade-offs                           | [`.ai/rfc/`](./.ai/rfc/README.md)                                       |
| Local-only feature specs (gitignored)               | `.ai/specs/`                                                            |
| Templates                                           | `.ai/templates/`                                                        |

The codebase is a DDD-inspired, layered structure: `src/app/` (composition
root), `src/shared/` (domain-free primitives), and `src/modules/<name>/`
(`domain` → `application` → `infrastructure` / `presentation`, plus optional
`content/`). Full detail in `docs/architecture.md`.

## Non-Negotiables

- **Inner layers never import outer ones.** `domain` is innermost;
  `presentation` outermost. See `docs/architecture.md` for the layer import
  rules.
- **Peer modules never import each other directly** — communicate through
  `application/ports/`; wire concrete adapters in the composition root.
- **Inside a module, use relative imports** (`./types`, `../domain/post.ts`).
  **Inside `src/shared/**`, use aliases only** (`@repo/shared/ui/button`).
Cross-module references go through aliases (`@repo/modules/\*`).
- **No barrel files** except where an interface boundary genuinely needs one.
- **Files are kebab-case; component identifiers are PascalCase.**
- **Style with CSS Modules; reference semantic tokens**
  (`var(--color-phosphor)`). Never inline hex or ad-hoc values outside
  `globals.css`.
- **Variant/size classes override local CSS custom properties** — they never
  duplicate property declarations.
- **Every HTML layer exposing `className` carries `data-slot="<name>"`.**
- **ASCII affordances** use brackets: `[ read more ]`, `[ ok ]`.
- **No comments unless asked**, and no emoji in UI chrome.
- Boundaries are enforced by `oxlint` (`oxlint.config.ts`) and circular imports
  by `import/no-cycle`.

## Key Commands

```sh
pnpm dev              # local preview
pnpm build            # compile content (prebuild) + static export
pnpm compile          # raw markdown -> compiled content
pnpm test             # unit/integration tests
pnpm check:lint       # oxlint + oxfmt check (run before committing)
pnpm format           # auto-fix formatting
pnpm author:new       # scaffold a draft
pnpm author:preflight # validate a draft
pnpm author:publish   # move a ready draft to content/raw/
```

Full reference, prerequisites, and troubleshooting:
[`docs/runbook.md`](./docs/runbook.md).

## AI Working Area (`.ai/`)

- `.ai/memory/` — versioned, numbered decision log (`<topic>/NNN-<kebab>.md`).
- `.ai/skills/` — agent-agnostic task workflows. See `.ai/skills/README.md`.
- `.ai/rfc/` — versioned proposals, lifecycle + index in `.ai/rfc/README.md`.
- `.ai/specs/` — local-only specs, **gitignored**; never commit them.
- `.ai/templates/` — starting points for specs, RFCs, memories, and posts.
