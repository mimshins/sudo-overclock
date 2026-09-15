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
  [`AGENTS.md`](./AGENTS.md). Routine changes, small fixes, and copy edits do
  not.

## Development setup

Requirements: Node.js `>= 24` and pnpm `10.22.0`.

```sh
pnpm install       # install dependencies
pnpm dev           # start the dev server
pnpm compile       # raw markdown -> generated content
pnpm build         # production static export (runs compile first)
pnpm test          # unit/integration tests
pnpm check:lint    # oxlint + oxfmt check
pnpm format        # auto-fix formatting
```

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
[`.ai/skills/post-authoring/pipeline.md`](./.ai/skills/post-authoring/pipeline.md).
Drafts live in `src/modules/blog/content/drafts/<slug>/`; the mechanical steps
are:

```sh
pnpm author:new <slug>        # scaffold a draft
pnpm author:preflight <slug>  # validate it
pnpm author:publish <slug>    # move it into content/raw/
```

Never edit `content/compiled/` or `public/posts/` by hand — both are generated.
See [`docs/authoring.md`](./docs/authoring.md) for frontmatter and body rules,
and [`docs/runbook.md`](./docs/runbook.md) for troubleshooting.

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

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](./LICENSE).
