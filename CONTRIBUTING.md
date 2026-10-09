# Contributing to sudo-overclock

Thanks for your interest in contributing. This is the engineering blog of
[@mimshins](https://github.com/mimshins). Code, documentation, and content fixes
are all welcome.

## Code of Conduct

This project is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md). By
participating, you are expected to uphold it.

## Before you start

- Open an issue to discuss a non-trivial change before writing code, so we can
  agree on scope.
- Architectural or design changes follow the spec-driven workflow in
  [`AGENTS.md`](./AGENTS.md): a spec, an RFC when there are real alternatives,
  and an ADR once it ships. Routine changes, small fixes, and copy edits do not.
- UI changes start from [`docs/design-system.md`](./docs/design-system.md) and
  must stay inside the identity in
  [`docs/design-language.md`](./docs/design-language.md).

## Development setup

Requirements: Node.js `>= 24` and pnpm `10.22.0`.

```sh
pnpm install       # install dependencies and the git hooks
pnpm dev           # start the dev server
pnpm compile       # raw markdown -> generated content
pnpm build         # production static export (runs compile first)
pnpm test          # unit/integration tests
pnpm check:lint    # oxlint + stylelint + oxfmt check
pnpm format        # auto-fix formatting
```

`pnpm install` sets `git config core.hooksPath .githooks`. The versioned
[`.githooks/pre-push`](./.githooks/pre-push) compiles content if it is missing,
then runs `pnpm check:lint` and `pnpm test`, and aborts the push on failure.
Bypass only in an emergency with `git push --no-verify`; CI runs the same gates.

## Project structure

The codebase is a layered, DDD-inspired module layout. The authoritative guide
is [`docs/architecture.md`](./docs/architecture.md); [`AGENTS.md`](./AGENTS.md)
is the onboarding index and lists the non-negotiable rules. Component
conventions live in [`docs/components.md`](./docs/components.md).

## Working on code

1. Keep changes inside the layer that owns the behaviour. Inner layers never
   import outer ones, and peer modules communicate through `application/ports/`
   — the rules are enforced by `oxlint`.
2. Use relative imports inside a module and aliases (`@repo/...`) across
   packages; never add a barrel file unless an interface boundary needs one.
3. Style with CSS Modules and semantic tokens (`var(--color-phosphor)`); never
   inline hex outside `globals.css`.
4. Run `pnpm check:lint` and `pnpm test` before opening a Pull Request.

## Working on content

Posts go through the staged authoring pipeline documented in
[`docs/authoring.md`](./docs/authoring.md#writing-pipeline). Drafts live in
`src/modules/blog/content/drafts/<slug>/`; the mechanical steps are:

```sh
pnpm author:new <slug>        # scaffold a draft
pnpm author:preflight <slug>  # validate it
pnpm author:publish <slug>    # move it into content/raw/
```

Never edit `content/compiled/` or `public/posts/` by hand — both are generated.
See [`docs/authoring.md`](./docs/authoring.md) for frontmatter and body rules,
and [`docs/runbook.md`](./docs/runbook.md) for troubleshooting.

## Where knowledge lives

| Artifact | Home                                  | Answers                                       |
| -------- | ------------------------------------- | --------------------------------------------- |
| docs     | [`docs/`](./docs/)                    | How does it work now, and what are the rules? |
| ADR      | [`decisions/`](./decisions/README.md) | Why was this decided?                         |
| RFC      | [`rfcs/`](./rfcs/README.md)           | What is proposed, and what were the options?  |
| tests    | `*.test.ts` beside the code           | Does the behavior hold?                       |
| AI layer | [`.ai/`](./.ai/README.md)             | How does an agent orient and do the work?     |

Project knowledge never lives only in `.ai/`; removing every AI tool leaves the
site, the authoring CLI, and every decision intact
([ADR-008](./decisions/ADR-008-agent-agnostic-knowledge-layer.md)).

## Working with AI agents

[`AGENTS.md`](./AGENTS.md) is the only instruction source. Skills and role
agents are defined once in [`.ai/skills/`](./.ai/skills/) and
[`.ai/agents/`](./.ai/agents/) and exposed through pointer-only adapters
(symlinks; on Windows enable `git config core.symlinks true`):

| Tool           | Finds instructions / skills / agents                          | Invoke a role                                             |
| -------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| Claude Code    | `CLAUDE.md` → `AGENTS.md`; `.claude/skills`, `.claude/agents` | "use the designer agent" or `@agent-designer`             |
| OpenCode       | `AGENTS.md`; `.opencode/skills`, `.opencode/agents`           | `@designer`                                               |
| Codex / others | `AGENTS.md`; `.agents/skills`                                 | "Act as the designer defined in `.ai/agents/designer.md`" |

Roles: **documenter** (spec/RFC/ADR), **designer** (UI brief and design-system
guardian), **implementer** (code + tests), **reviewer** (architecture,
design-system, and drift check, on request), **editor** (post stages). A typical
change: documenter → designer (if UI) → implementer → your review → reviewer
(optional). **Agents never stage, commit, or push unless you ask.**

## Commit messages

- Use the present tense ("Add feature", not "Added feature") and the imperative
  mood ("Move cursor to...", not "Moves cursor to...").
- Keep the first line to 72 characters or less.
- Reference issues and Pull Requests where relevant.
- Use a conventional prefix: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`,
  `test`, `build`, `ci`, `chore`, or `revert`.

## Pull requests

- Keep them small and focused — one feature or fix per Pull Request.
- Describe what changed and why, and link the related issue.
- Make sure `pnpm check:lint` and `pnpm test` pass; CI runs both plus a build.
- Add a changeset when the PR touches code, public assets, build config, or
  dependencies: `pnpm changesets:create` (or `pnpm changesets:empty` for
  internal-only work). CI checks for it; the bump rules are in
  [`docs/runbook.md#release`](./docs/runbook.md#release).
- Fill in the [PR template](./.github/PULL_REQUEST_TEMPLATE.md) definition of
  done.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](./LICENSE).
