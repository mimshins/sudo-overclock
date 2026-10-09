# AGENTS.md

The only instruction source for AI agents working on sudo-overclock — the
author's statically generated engineering blog. Every tool reads this file
(Claude Code through `CLAUDE.md` → `@AGENTS.md`); tool folders only point into
`.ai/`. Read this first, then follow the links; do not duplicate their contents
here.

AI knowledge layer: [`.ai/README.md`](./.ai/README.md). Project knowledge stands
on its own in [`docs/`](./docs/), [`decisions/`](./decisions/README.md), and
[`rfcs/`](./rfcs/README.md).

## Approval gate — never stage or commit on your own

**Do not run `git add`, `git commit`, or `git push` (or anything that stages,
such as `git mv` or `git rm`) unless the author explicitly asks.** After
verification, stop and hand the diff to the author. The
[reviewer agent](./.ai/agents/reviewer.md) runs when the author asks for it. An
approval covers the reviewed diff only.

## Precedence

When sources disagree, trust them in this order (highest first):

1. the author's explicit instructions;
2. code and config;
3. `docs/`;
4. `decisions/`;
5. accepted `rfcs/`;
6. `.ai/memories/`;
7. working memories;
8. assumptions.

Fix or flag the lower source and say so. An RFC that is not `Accepted` never
overrides accepted knowledge.

## Spec-Driven Development

For an **architectural or design change** — one that alters module boundaries,
the content pipeline, cross-cutting patterns, major dependencies, the design
system's foundations, or otherwise involves meaningful trade-offs:

1. **Require a spec.** Ask the author for one (or draft it for the author to
   edit) from [`.ai/templates/spec.md`](./.ai/templates/spec.md), in
   `.ai/specs/` (local, gitignored).
2. **Clarify** until ambiguities are resolved.
3. **RFC** when there are real alternatives
   ([write-an-rfc](./.ai/skills/write-an-rfc/SKILL.md)).
4. **Task breakdown** into ordered, actionable tasks.
5. **Confirm** with the author before writing code.

The author may waive the RFC step for a decision they make directly (for example
in a design review); the ADR then records the waiver and the options that were
considered.

Routine implementation, small changes, and bug fixes need no spec unless they
are architectural. UI work starts from a design brief
([design-a-feature](./.ai/skills/design-a-feature/SKILL.md)).

## Mandatory Actions

- **Follow the authoring pipeline.** Posts follow
  [`docs/authoring.md`](./docs/authoring.md#writing-pipeline) via the
  [post-authoring](./.ai/skills/post-authoring/SKILL.md) skill. Drafts live in
  `content/drafts/<slug>/`; never write to `content/raw/`, `content/compiled/`,
  or `public/` by hand. During editorial, **propose diffs and inline notes —
  never silently rewrite the author's prose**, and never publish.
- **Hold the design line.** UI follows
  [`docs/design-language.md`](./docs/design-language.md) (identity) and
  [`docs/design-system.md`](./docs/design-system.md) (tokens, primitives,
  patterns, extension rules). A new token, variant, or component is justified
  and documented in the same change; changing the identity needs an RFC.
- **Write an RFC before implementing trade-off decisions.** Draft
  `rfcs/active/RFC-NNN-<kebab>.md`. When it ships: fold the current state into
  `docs/`, record `decisions/ADR-NNN-<kebab>.md`, set the RFC to `Implemented`,
  and move it to `rfcs/archived/`.
- **Record decisions as ADRs.** A hard-to-reverse choice (including any new
  runtime `dependencies` entry) gets an ADR, even without an RFC.
- **Keep knowledge in sync.** Run
  [knowledge-drift-sync](./.ai/skills/knowledge-drift-sync/SKILL.md) before
  handing off; use the table below. Update `.ai/memories/` (and their
  `last-verified`) when orientation changes; resolve working memories tied to
  the change. A change that leaves docs stale is incomplete.
- **Add a changeset** for any change to code, public assets, build config, or
  dependencies: `pnpm changesets:create` with the bump from
  [`docs/runbook.md#release`](./docs/runbook.md#release) (on `0.x`, never
  `major`), or `pnpm changesets:empty` for internal-only work. Posts and docs
  need none.
- **Verify before finishing.** `pnpm check:lint` and `pnpm test`; also
  `pnpm build` when the compiler, content, or app is touched.

## Knowledge maintenance

| If you change...                             | Review...                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| layers, module shape, imports, aliases       | `docs/architecture.md`, `oxlint.config.ts`, `.ai/memories/architecture.md`                                          |
| the compiler or generated output             | `docs/architecture.md#content-pipeline`, `docs/authoring.md`, `docs/runbook.md`, `.ai/memories/content-pipeline.md` |
| the authoring CLI, stages, or post templates | `docs/authoring.md`, `docs/runbook.md`, `.ai/skills/post-authoring/`                                                |
| tokens, typography, color, motion, layout    | `docs/design-system.md`, `docs/design-language.md`, `src/app/globals.css`                                           |
| images, illustrations, icons, backgrounds    | `docs/imagery.md`, `docs/design-system.md`                                                                          |
| a component (new, variant, slot)             | `docs/components.md`, `docs/design-system.md`                                                                       |
| scripts, CI, deploy, hooks                   | `docs/runbook.md`, `README.md`, `CONTRIBUTING.md`, `.ai/memories/development-workflow.md`                           |
| tests or test tooling                        | `docs/architecture.md#testing-strategy`, `vitest.config.ts`, `docs/components.md#testing-a-component`               |
| a dependency                                 | an ADR for runtime `dependencies`; `README.md` tech stack                                                           |
| releases, versioning, changesets             | `docs/runbook.md#release`, `.changeset/config.json`, ADR-009                                                        |
| a shipped RFC                                | its ADR, `rfcs/README.md` and `decisions/README.md` indexes                                                         |
| the AI layer (skills, agents, adapters)      | `.ai/README.md`, this file, `CONTRIBUTING.md#working-with-ai-agents`                                                |

## Where Things Live

| Topic                                               | Location                                               |
| --------------------------------------------------- | ------------------------------------------------------ |
| Architecture, module boundaries, naming, DI, tokens | [`docs/architecture.md`](./docs/architecture.md)       |
| Visual identity — the phosphor/CRT design language  | [`docs/design-language.md`](./docs/design-language.md) |
| Design system — tokens, primitives, patterns, rules | [`docs/design-system.md`](./docs/design-system.md)     |
| Components                                          | [`docs/components.md`](./docs/components.md)           |
| Imagery & illustration — pixel, dotted, duo-color   | [`docs/imagery.md`](./docs/imagery.md)                 |
| Content authoring (pipeline + publishing mechanics) | [`docs/authoring.md`](./docs/authoring.md)             |
| Commands, local workflow, troubleshooting, release  | [`docs/runbook.md`](./docs/runbook.md)                 |
| Accepted decisions (ADRs)                           | [`decisions/`](./decisions/README.md)                  |
| Proposals (RFCs)                                    | [`rfcs/`](./rfcs/README.md)                            |
| Agent orientation, skills, roles, templates         | [`.ai/`](./.ai/README.md)                              |
| Local-only task specs (gitignored)                  | `.ai/specs/`                                           |

The codebase is a DDD-inspired, layered structure: `src/app/` (composition
root), `src/shared/` (domain-free primitives), and `src/modules/<name>/`
(`domain` → `application` → `infrastructure` / `presentation`, plus optional
`content/`). Full detail in `docs/architecture.md`.

## Non-Negotiables

**Code**

- **Inner layers never import outer ones.** `domain` is innermost;
  `presentation` outermost. See `docs/architecture.md`.
- **Peer modules never import each other directly** — communicate through
  `application/ports/`; wire concrete adapters in the composition root.
- **Inside a module, use relative imports** (`./types`, `../domain/post.ts`).
  **Inside `src/shared/**`, use aliases only** (`@repo/shared/ui/button`).
  Cross-module references go through aliases (`@repo/modules/\*`).
- **No barrel files** except where an interface boundary genuinely needs one.
- **Files are kebab-case; component identifiers are PascalCase.**
- **Runtime code never reads from `.ai/`.**
- **No comments unless asked**, with two standing exceptions: the file-header
  doc comment that opens scripts and infrastructure modules, and a short comment
  stating a non-obvious constraint the code cannot express (for example why
  box-drawing glyphs drop letter-spacing). See `docs/architecture.md#comments`.
- Boundaries are enforced by `oxlint` (`oxlint.config.ts`) and circular imports
  by `import/no-cycle`. Never weaken a rule to go green.

**Design**

- **Style with CSS Modules; reference semantic tokens**
  (`var(--color-phosphor)`). Never inline hex or ad-hoc values outside
  `globals.css`.
- **Variant/size classes override local CSS custom properties** — they never
  duplicate property declarations.
- **Every HTML layer exposing `className` carries `data-slot="<name>"`.**
- **ASCII affordances** use brackets: `[ read more ]`, `[ ok ]`. No emoji in UI
  chrome.
- Motion always has a `prefers-reduced-motion` path; focus is always visible.

**Process and safety**

- Approval gate above; one logical change at a time.
- No secrets, tokens, credentials, or private hostnames in any file.
- Never fabricate commands, numbers, sources, or decisions — unknowns become
  `<!-- TODO -->` markers, `[unverified]` flags, or questions.
- A new runtime `dependencies` entry needs an ADR.

## Key Commands

```sh
pnpm dev              # local preview
pnpm build            # compile content (when stale) + static export
pnpm compile          # raw markdown -> compiled content
pnpm test             # unit/integration tests
pnpm check:lint       # oxlint + stylelint + oxfmt check (pre-push runs it)
pnpm format           # auto-fix formatting
pnpm author:new       # scaffold a draft
pnpm author:preflight # validate a draft
pnpm author:publish   # move a ready draft to content/raw/ (author only)
pnpm changesets:create # describe a change and its semver bump
pnpm changesets:empty  # internal-only change, no release
```

Full reference, prerequisites, and troubleshooting:
[`docs/runbook.md`](./docs/runbook.md).
