# RFC-009 — Content-Addressed Build Caching: Compiler, Tasks, and CI

- **Status:** Implemented
- **Date:** 2026-10-09
- **Supersedes:** —
- **Superseded by:** —

## Context

Measured locally on 2026-10-09 (Apple Silicon, 1 published post with 3 images,
cold = no `.next/`, no compiled output):

| Step                  | Time                    |
| --------------------- | ----------------------- |
| `pnpm compile`        | 3.3 s                   |
| `oxlint` (type-aware) | 2.0 s                   |
| `oxfmt --check`       | 1.2 s                   |
| `pnpm test`           | 0.8 s                   |
| `next build`          | 6.4 s cold / 2.7 s warm |

Today's absolute numbers are small. The problem is how they scale and how often
work is repeated:

1. **Compile cost grows with every image ever published.** `compileAll` deletes
   `public/posts/` on every run (`infrastructure/compiler/compile.ts`), so every
   image is re-encoded (AVIF + WebP + fallback, ADR-004) on every compile, even
   though output filenames are already content hashes of
   `source bytes + transform parameters`. Fifty posts with three images each
   means ~150 encodes per compile.
2. **CI repeats the work.** A push to `main` encodes every image three times:
   `ci.yml` runs `pnpm compile`, then `pnpm build` compiles again through
   `prebuild`, and `deploy.yml` builds from scratch. Neither workflow caches
   `.next/cache`, although a warm Turbopack cache cut `next build` by 58%
   locally.
3. **Nothing skips unchanged work.** Lint, format check, tests, and build run in
   full on every invocation (locally, in the pre-push hook, and in CI), whether
   or not their inputs changed. The pre-push hook (ADR-008) can only tell
   whether compiled content is _missing_, not whether it is _stale_.

Also observed: `next build` and `next dev` rewrite the committed `next-env.d.ts`
differently (`.next/types/…` vs `.next/dev/types/…`), so the file churns in the
working tree.

## Options

### Option A — Content-addressed image store inside the compiler

Keep encoded variants in a persistent store outside the wiped output, keyed by
the existing source hash plus an encoder fingerprint; encode only on a miss.

- **Pros:** targets the only cost that grows; one new image costs one encode;
  works identically locally, in the hook, and in CI; no new dependency; reuses
  the ADR-004 hash so URLs do not change.
- **Cons:** a cache to prune; one more compiler concern to test.

### Option B — CI hygiene

One workflow: compile once, build once, deploy the built artifact; cache
`.next/cache` and the image store with `actions/cache`.

- **Pros:** removes duplicated work outright; no new dependency.
- **Cons:** does not help local runs; cache keys must be designed carefully.

### Option C1 — Task-level fingerprinting with wireit

Declare `files`, `output`, `env`, and `dependencies` per script in
`package.json`; wireit skips a script whose fingerprint (SHA-256 of inputs,
lockfile, env, Node version, platform) is unchanged and restores outputs from a
local (`.wireit/`) or GitHub Actions cache.

- **Pros:** built for single packages; config stays in `package.json`; official
  GitHub Actions cache (`google/wireit@setup-github-actions-caching/v2`);
  explicit dependency graph replaces the `prebuild` hook; the pre-push hook gets
  "compile when stale" for free.
- **Cons:** pre-1.0 with a slow release pace (0.14.13, June 2026); wrong `files`
  globs give silently stale results; the local cache has no size limit; the
  fingerprint includes Node version and platform, so local and CI caches never
  share entries; GitHub Actions cache entries are evicted after 7 days.

### Option C2 — Task-level fingerprinting with turbo

- **Pros:** actively maintained; mature hashing; single-package mode exists.
- **Cons:** shaped for monorepos (`turbo.json` beside `package.json`); remote
  caching targets Vercel or a self-hosted server, and GitHub Actions caching
  needs third-party actions; more surface than this repository needs.

## Decision

**A + B + C1 (wireit), with a single CI/deploy workflow.** A and B fix the cost
that grows and the duplicated work without a new tool; C1 adds input-based
skipping and cache restore across every script.

### A — Compiler image store

- Store: `node_modules/.cache/sudo-overclock/images/<encoder>/<hash>.<ext>` plus
  a `<hash>.json` sidecar (variants, width, height). `node_modules/` is a
  conventional cache location, is gitignored, survives the `public/posts/` wipe,
  and is excluded from wireit globs by default.
- Key: the existing 12-hex `sha256(source + transform params)` from ADR-004.
  `<encoder>` is the `sharp` + libvips version, so an upgrade invalidates the
  store without changing URLs.
- Hit: copy variants into `public/posts/<slug>/` and read dimensions from the
  sidecar (no decode). Miss: encode as today, write the store, then copy.
- Prune entries not used for 30 days at the end of a compile.
- Outputs restored from a store filled on another machine may differ in bytes
  from a local encode; URLs do not, which ADR-004 already accepts.

### B — One workflow

- `ci.yml` absorbs `deploy.yml`: a `quality` job (format, lint, test), a `build`
  job (compile once, `next build`, upload the Pages artifact on `main`), and a
  `deploy` job (`needs: build`, `main` pushes only) that deploys the uploaded
  artifact.
- `actions/cache` for the image store (key: hash of image sources under
  `content/raw/**` + `sharp` version; broad `restore-keys`, safe because entries
  are content-addressed) and for `.next/cache` (key: lockfile + `src/**` hash;
  `restore-keys` on the lockfile).
- Third-party actions are pinned by commit SHA.

### C1 — wireit

- Scripts `compile`, `check:lint:oxlint`, `check:format`, `test`, and `build`
  become wireit scripts with explicit `files` / `output`; `build` and lint
  depend on `compile`; `NEXT_PUBLIC_SITE_URL` is an external `env` input of
  `build`; `prebuild` is removed. `test` and the checks use `"output": []`.
- `.wireit/` is gitignored; the runbook documents pruning
  (`rm -rf .wireit/*/cache`).
- CI enables `google/wireit@setup-github-actions-caching/v2` (pinned).
- The pre-push hook becomes `pnpm check:lint && pnpm test`; wireit compiles only
  when inputs changed — replacing the "compile only if missing" check from
  ADR-008 with a stricter one.

## Consequences

- Compile cost becomes proportional to _new or changed_ images; CI encodes each
  image at most once per cache lifetime; unchanged scripts are skipped.
- One new devDependency (`wireit`, no ADR required by the dependency rule).
- Risk of stale results from wrong globs: mitigated by a weekly scheduled CI run
  with `WIREIT_CACHE=none` and no restored caches, and by keeping `files` globs
  broad (whole directories, not file lists).
- New upkeep: cache pruning, SHA-pinned action bumps, glob maintenance when
  files move.
- Acceptance is measured, not asserted: cold compile, no-change compile, compile
  after adding one image, and CI wall time for a PR and a `main` push, before
  and after.

## Resolution

Accepted and implemented on 2026-10-09; recorded in
[ADR-011](../../decisions/ADR-011-build-caching.md). Open questions resolved by
the author: `next-env.d.ts` is gitignored; the weekly scheduled CI run builds
with no caches (no output diff); image-store entries unused for 30 days are
pruned.
