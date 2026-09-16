# Runbook

Commands, local workflow, troubleshooting, and release for sudo-overclock.

## Prerequisites

- Node `>= 24` (pinned: `24.10.0` via Volta)
- pnpm `10.22.0` (declared in `packageManager`)

## Commands

| Command                        | What it does                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `pnpm dev`                     | Start the Next.js dev server.                                                                 |
| `pnpm compile`                 | Compile `content/raw/**` → `content/compiled/index.ts`; optimize assets into `public/posts/`. |
| `pnpm build`                   | `prebuild` runs `pnpm compile`, then Next.js static export to `out/`.                         |
| `pnpm test`                    | Unit/integration tests (`tsx --test src/**/*.test.ts`).                                       |
| `pnpm check:lint`              | `oxlint` + `oxfmt --check`. Run before committing.                                            |
| `pnpm format`                  | Auto-fix formatting (`oxfmt --write` + `oxlint --fix`).                                       |
| `pnpm author:new <slug>`       | Scaffold a draft in `content/drafts/<slug>/`.                                                 |
| `pnpm author:preflight <slug>` | Validate a draft; non-zero exit on failure.                                                   |
| `pnpm author:publish <slug>`   | Move a ready draft to `content/raw/<slug>/`.                                                  |

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
[`.ai/skills/post-authoring/pipeline.md`](../.ai/skills/post-authoring/pipeline.md).
The mechanical steps:

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

Versioning uses changesets:

```sh
pnpm changesets:create   # add a changeset
pnpm changesets:status   # inspect pending changesets
pnpm changesets:apply    # version packages
pnpm release             # build + publish
```

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
