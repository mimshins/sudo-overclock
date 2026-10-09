# ADR-012 — Release-Gated Code Deploys, Continuous Posts

- **Status:** Accepted
- **Date:** 2026-10-09
- **Topic:** repository / release
- **RFC:** waived by the author, who chose the model directly on 2026-10-09
  (options below). Supersedes the deploy policy of
  [ADR-009](./ADR-009-changesets-semver-releases.md).

## Context

ADR-009 kept deploys on every push to `main` and used releases only as changelog
and tags. In practice the version said nothing about the site: the 404 page went
live with the push that added it, while the release that describes it (v0.2.0)
was still an open version PR. The author asked what a changeset is for if every
push deploys.

## Decision

- **Posts deploy continuously.** A push to `main` that changes
  `src/modules/blog/content/raw/` deploys right away.
- **Code deploys with a release.** A push that changes only code (or docs)
  deploys nothing; merging the version PR tags `vX.Y.Z`, creates the GitHub
  Release, and deploys.
- **A deploy is always "latest release code + main's posts".** The reusable
  `deploy.yml` checks out the newest `v*` tag, replaces
  `src/modules/blog/content/raw/` with the version on `main`, builds, and
  publishes. So a post never ships unreleased code. Before the first release it
  builds `main` as is. It runs by hand for redeploys.
- **Wiring.** `ci.yml` detects post changes against the previous push and calls
  `deploy.yml`; `release.yml` detects the tag it just created and calls
  `deploy.yml` (tags made with the workflow token trigger no other workflow).
- **What is live is visible.** The footer shows `v<version> · <posts commit>`;
  the feed's `<generator>` and `llms.txt` carry the same. The build reads
  `NEXT_PUBLIC_SITE_VERSION` and `NEXT_PUBLIC_CONTENT_SHA`, defaulting to
  `package.json` and the current commit.
- **Dependabot PRs** are exempt from the changeset check; their updates ship
  with the next release, or with a `patch` changeset added on `main` when they
  must ship alone.

## Options considered

| Option                        | Outcome                                                              |
| ----------------------------- | -------------------------------------------------------------------- |
| **Hybrid (chosen)**           | Code equals a tagged release; writing stays frictionless.            |
| Deploy on release only        | Strictest; every post would wait for (or require) a release.         |
| Keep deploy-on-push (ADR-009) | Simplest; the version stays informational and can lag the live site. |
| Drop changesets               | Least ceremony; no changelog, tags, or release notes.                |

## Rationale

The version only means something if it describes what is live. Gating code on
releases achieves that, while separating posts keeps the blog's main activity —
publishing — independent of release ceremony. Building "release code + current
posts" (rather than `main`) is what makes the two compatible: content can move
ahead without dragging unreleased code onto the site.

## Consequences

- Code changes reach the site only when the version PR is merged; merge it to
  ship.
- A post that depends on unreleased code (a new markdown feature, a new
  component) waits for the release; if it fails to build against the released
  code, the post deploy fails visibly instead of shipping half-working.
- Docs-only pushes do not deploy (they are not part of the site).
- Two more workflow pieces to maintain: post-change detection and the reusable
  deploy.
