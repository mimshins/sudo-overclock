# Runbook

Commands, local workflow, troubleshooting, and release for sudo-overclock.

## Prerequisites

- Node `>= 24` (pinned: `24.10.0` via Volta)
- pnpm `10.22.0` (declared in `packageManager`)

Run `pnpm install` once after cloning: besides dependencies, its `prepare`
script points git at the versioned hooks (`core.hooksPath=.githooks`). The
`pre-push` hook compiles content only when `content/compiled/index.ts` is
missing, then runs `pnpm check:lint` and `pnpm test`; a failure aborts the push.

## Commands

| Command                        | What it does                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `pnpm dev`                     | Start the Next.js dev server.                                                                 |
| `pnpm compile`                 | Compile `content/raw/**` → `content/compiled/index.ts`; optimize assets into `public/posts/`. |
| `pnpm build`                   | `prebuild` runs `pnpm compile`, then Next.js static export to `out/`.                         |
| `pnpm test`                    | Unit/integration tests (`tsx --test src/**/*.test.ts`).                                       |
| `pnpm check:lint`              | `oxlint` + `stylelint` + `oxfmt --check`. Run before committing (pre-push runs it).           |
| `pnpm format`                  | Auto-fix (`oxfmt --write` + `oxlint --fix` + `stylelint --fix`).                              |
| `pnpm author:new <slug>`       | Scaffold a draft in `content/drafts/<slug>/`.                                                 |
| `pnpm author:preflight <slug>` | Validate a draft; non-zero exit on failure.                                                   |
| `pnpm author:publish <slug>`   | Move a ready draft to `content/raw/<slug>/`.                                                  |
| `pnpm brand:icons`             | Regenerate `src/app/apple-icon.png` from `src/app/icon.svg`.                                  |

## Local workflow

```sh
# Preview with fresh content
pnpm compile && pnpm dev
```

`content/compiled/` and `public/posts/` are generated and gitignored. Never edit
them by hand. `pnpm compile` deletes `public/posts/` before rewriting, so stale
assets do not accumulate.

## Writing and publishing a post

Writing is a staged, human-led process documented in
[`docs/authoring.md`](./authoring.md#writing-pipeline). The mechanical steps:

```sh
pnpm author:new my-post-slug      # scaffold content/drafts/my-post-slug/
# ... write, revise, and stage in post.md ...
pnpm author:preflight my-post-slug
pnpm author:publish my-post-slug  # moves to content/raw/my-post-slug/
pnpm compile && pnpm dev          # preview
```

`author:preflight` checks required frontmatter, ISO date, description length,
relative image existence, code-fence languages, image alt text, and slug
uniqueness against `raw/` and other drafts. `author:publish` refuses to
overwrite an existing published slug.

See [`docs/authoring.md`](./authoring.md) for frontmatter fields and markdown
body rules.

## Deployment

Hosting is GitHub Pages. `.github/workflows/ci.yml` lints, tests, and builds on
every push and PR; `.github/workflows/deploy.yml` builds and deploys the static
export on every push to `main`. A commit to `main` is a deploy.

CI sets `NEXT_PUBLIC_SITE_URL=https://sudo-overclock.space`; the build uses
root-relative paths for the custom-domain apex.

## Release

The site's **code** is versioned with semver and
[changesets](https://changesets.dev)
([ADR-009](../decisions/ADR-009-changesets-semver-releases.md)). Deploys are
independent: every push to `main` deploys, while releases mark versions and
produce `CHANGELOG.md` and GitHub Releases.

### What gets a changeset

Files matching `changedFilePatterns` in `.changeset/config.json` (`src/**`
except tests, posts, and drafts; `scripts/**`; `public/**`; build config;
`package.json`; the lockfile) need a changeset. Posts, drafts, `docs/`,
`decisions/`, `rfcs/`, `.ai/`, and CI do not.

| Bump    | When                                                                                                                             |
| ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `major` | Breaks a public contract: URLs/permalinks, RSS feed shape, `llms.txt` structure, heading-anchor scheme, or an identity overhaul. |
| `minor` | A new reader-visible feature, page, section, or component.                                                                       |
| `patch` | Fixes, performance, styling refinements, reader-visible dependency updates.                                                      |
| empty   | Internal-only code changes (refactors, tooling, tests) — `pnpm changesets:empty`.                                                |

**While on `0.x`:** never use `major`; breaking changes are `minor`. The site
moves to `1.0.0` with a `major` changeset when the first real post is published
(`hello-world` does not count).

### Flow

```sh
pnpm changesets:create   # in the change: describe it, pick the bump
pnpm changesets:status   # inspect pending changesets
```

1. Changesets land on `main` with their changes. CI fails a PR that touches
   tracked files without one (`pnpm changesets:check`).
2. The `release` workflow keeps a **"chore(release): version packages"** PR open
   that bumps `package.json` and writes `CHANGELOG.md`
   (`@changesets/changelog-github`: PR links and authors).
3. Merging that PR tags `vX.Y.Z` and creates the GitHub Release (`pnpm release`
   → `changeset publish`; the package is private, so nothing goes to npm).

Requirements: the repository setting _Actions → General → Allow GitHub Actions
to create and approve pull requests_ must be on. PRs opened by the workflow's
token do not trigger other workflows, so CI does not run on the version PR
itself. `pnpm changesets:apply` needs `GITHUB_TOKEN` for the GitHub changelog
format; run it locally only if needed, as
`GITHUB_TOKEN=$(gh auth token) pnpm changesets:apply`.

## Troubleshooting

### `pnpm compile` fails resolving an image

Asset paths are resolved relative to the post's directory. A path like
`![x](./x.png)` must sit beside the markdown. `pnpm author:preflight` catches
missing assets before publish.

### `pnpm compile` is slow, or image encoding fails

`pnpm compile` transcodes every local raster image to AVIF and WebP via `sharp`
(a native `devDependency`), so it is CPU-bound — larger posts take longer.
Encoding concurrency is derived from the host's core count; set
`SOC_IMAGE_CONCURRENCY=<n>` to override it (useful on constrained CI runners).
If `sharp` cannot decode or encode a file, the compiler warns on stderr and
copies the original under a hashed name instead of failing; check that the asset
is a valid image.

### A replaced post image still looks old

Local images are content-addressed: overwriting an image changes its URL on the
next compile, so caches (browser and CDN) miss automatically. If an old image
persists, confirm the compile ran and that the page references the new hashed
filename.

### Code block has no highlighting

The opening fence must declare a language (for example `ts`). Common aliases map
to Shiki ids (`ts`→typescript, `sh`/`shell`→bash, `py`→python, `js`→javascript).
Check `LANG_ALIASES` in `infrastructure/compiler/pipeline.ts` for the current
map.

### A heading is missing from the TOC

Only `h2`–`h6` are indexed; a single leading `h1` is stripped from the body
because the page renders the title as its only `h1`. Start the body at `h2`.

### Drafts appearing on the site

The compiler globs `content/raw/**` only. If a draft shows up, it is in `raw/` —
move it back to `content/drafts/<slug>/`.

### Frontmatter errors

The compiler requires `title` and `date` (`YYYY-MM-DD`). `author:preflight`
additionally requires `description` and `tags` for posts. See
[`docs/authoring.md`](./authoring.md) for the full field table and
`pnpm author:preflight` for automated checks.
