# ADR-011 — Content-Addressed Build Caching

- **Status:** Accepted
- **Date:** 2026-10-09
- **Topic:** build / CI
- **RFC:** [RFC-009](../rfcs/archived/RFC-009-build-caching.md)

## Context

Every compile re-encoded every image ever published (AVIF + WebP + fallback),
because `compileAll` wipes `public/posts/` and nothing kept encoded output
between runs, although filenames were already content hashes
([ADR-004](./ADR-004-post-asset-pipeline.md)). CI repeated the work: a push to
`main` compiled three times across `ci.yml`, the `prebuild` hook, and
`deploy.yml`, with no `.next/cache`. Lint, format, tests, and build always ran
in full, and the pre-push hook could only tell whether compiled content was
missing, not stale.

## Decision

1. **Compiler image store.** Encoded variants live in
   `node_modules/.cache/sudo-overclock/images/<encoder>/`, keyed by the existing
   source hash, with a `<hash>.json` sidecar (formats, fallback, width, height).
   `<encoder>` is the `sharp` + libvips version. A hit copies variants into
   `public/posts/` with no decode or encode; a miss encodes into `public/posts/`
   as before and then saves to the store (temp file + rename, sidecar last, so
   the sidecar commits the entry). Corrupt or incomplete entries are misses.
   Entries unused for 30 days and other encoder directories are pruned after
   each compile. Store failures only warn. The root is injected
   (`CompileOptions.imageCacheDir`); the encoder is an injected seam
   (`ImageEncoder`) for tests.
2. **One CI workflow.** `ci.yml` runs `quality` (oxlint, stylelint, oxfmt,
   tests) and `build`; on `main`, `deploy` publishes the built `out/` artifact.
   `deploy.yml` is gone. CI restores the wireit cache, the image store, and
   `.next/cache`. A weekly scheduled run uses no caches at all.
3. **wireit.** `compile`, `build`, `test`, and every `check:*` script declare
   `files` and `output`; `build` and `check:lint:oxlint` depend on `compile`;
   `NEXT_PUBLIC_SITE_URL` is an external `env` input of `build`; `prebuild` is
   removed. CI uses `google/wireit@setup-github-actions-caching/v2` pinned by
   SHA. `.wireit/` is gitignored.
4. **Pre-push** runs `pnpm check:lint && pnpm test`; wireit compiles only when
   inputs changed. This replaces the "compile only if missing" check recorded in
   [ADR-008](./ADR-008-agent-agnostic-knowledge-layer.md).
5. **`next-env.d.ts` is gitignored** (Next regenerates it on `dev`/`build`).

## Rationale

The image store targets the only cost that grows with content and works the same
locally, in the hook, and in CI; reusing the ADR-004 hash keeps URLs stable.
Encoding into `public/` first and then saving keeps the no-store and miss paths
identical, so a broken store can never stop images from shipping. wireit fits a
single package, keeps configuration in `package.json`, and has an official
GitHub Actions cache; its stale-glob risk is mitigated by broad directory globs
and the weekly uncached run. Turbo was rejected as monorepo-shaped, with remote
caching aimed at Vercel or self-hosting.

## Consequences

Measured on 2026-10-09 (Apple Silicon, 1 post, 3 images):

| Run                                   | Before               | After                    |
| ------------------------------------- | -------------------- | ------------------------ |
| `pnpm compile`, store empty → warm    | 3.3 s every run      | 2.06 → 0.69 s            |
| `pnpm build`, cold → unchanged inputs | 6.4 s + compile      | 5.62 → 0.48 s (skipped)  |
| `pnpm build` after editing one post   | full compile + build | 3.13 s (images restored) |
| `pnpm test`, cold → unchanged         | 0.8 s every run      | 1.01 → 0.48 s            |
| `pnpm check:lint`, warm               | ~3.2 s every run     | 1.29 s                   |

- Compile cost is proportional to new or changed images.
- New devDependencies: `wireit`, `stylelint` (no ADR required for
  devDependencies, [ADR-009](./ADR-009-changesets-semver-releases.md)).
- Upkeep: keep wireit `files` globs covering every file a script reads; clear
  `.wireit/` occasionally (no size limit); bump SHA-pinned actions deliberately.
- `next-env.d.ts` must be untracked (`git rm --cached next-env.d.ts`) in the
  commit that lands this change.
