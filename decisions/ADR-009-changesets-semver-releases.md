# ADR-009 — Semver Releases with Changesets

- **Status:** Accepted
- **Date:** 2026-10-09
- **Topic:** repository / release
- **RFC:** waived by the author, who chose the tool and each policy directly on
  2026-10-09 (options below).

## Context

The repository listed `@changesets/cli` and `@changesets/changelog-github` and
had `changesets:*` and `release` scripts, but changesets was never initialized:
there was no `.changeset/config.json`, no tag, no release, and no changelog.
`release` ran `pnpm build && changeset publish` on a private package, which does
nothing useful, and `docs/runbook.md` described that flow as if it worked. A
website has no npm consumers, so "semver" needed a definition before it could be
applied.

## Decision

- **What is versioned:** the site's code and behavior. Posts are content with
  their own dates and feed; publishing one needs no changeset.
- **Semver for a website:** `major` breaks a public contract (URLs/permalinks,
  RSS feed shape, `llms.txt` structure, heading-anchor scheme, or an identity
  overhaul); `minor` adds a reader-visible feature, page, section, or component;
  `patch` covers fixes, performance, styling refinements, and reader-visible
  dependency updates; internal-only work uses an empty changeset.
- **0.x until the first real post:** `major` is not used on `0.x` (breaking
  changes are `minor`); the site moves to `1.0.0` with the first real post.
- **Tooling:** changesets v3 with
  `privatePackages: { version: true, tag: true }` so a private package is
  versioned and tagged `vX.Y.Z` without npm; `@changesets/changelog-github` for
  PR-linked changelog entries; `changedFilePatterns` limits "needs a changeset"
  to code, public assets, build config, and dependencies.
- **Flow:** `changesets/action` v2 (pinned by SHA) on every push to `main` keeps
  a "chore(release): version packages" PR open; merging it bumps `package.json`,
  writes `CHANGELOG.md`, tags, and creates a GitHub Release. Deploys stay on
  every push to `main`, independent of releases.
- **Enforcement:** a CI job fails a PR that changes tracked files without a
  changeset (`changeset status --since=origin/main`); direct pushes to `main`
  are not blocked.

## Options considered

Presented to the author; the chosen option is first.

| Question      | Chosen                                | Also considered                                         |
| ------------- | ------------------------------------- | ------------------------------------------------------- |
| Tool          | changesets                            | release-please, semantic-release (commit-derived)       |
| Posts         | not versioned                         | a patch changeset per post; a separate content log      |
| Flow          | version PR, deploy on every push      | version PR with deploy on release; manual local release |
| Enforcement   | CI check on PRs                       | CI + pre-push; advisory only                            |
| First version | stay on 0.x until the first real post | release 1.0.0 now                                       |

## Rationale

Changesets was already the chosen tool and fits a single private package once
private tagging is enabled; release-please and semantic-release would derive
versions from commit messages, which ties release notes to commit wording rather
than reader-facing descriptions. Keeping deploys on every push lets posts and
fixes ship immediately while releases still mark meaningful versions.
`changedFilePatterns` keeps writing frictionless: posts and docs never ask for a
changeset. Staying on `0.x` until the first real post matches the site's "still
settling" state.

## Consequences

- The live site can be ahead of the latest tag; a release marks a version, not a
  deploy.
- The repository setting "Allow GitHub Actions to create and approve pull
  requests" must be enabled for the version PR.
- Version PRs opened with the workflow token do not trigger CI on themselves.
- Local `changeset version` needs `GITHUB_TOKEN` because of the GitHub changelog
  format.
- Verified on 2026-10-09 in a scratch repository: a code change without a
  changeset fails `changeset status`; post/docs-only changes pass; an empty
  changeset passes; `changeset version` + `changeset publish` bump the version,
  write the changelog, and create the `vX.Y.Z` tag.
