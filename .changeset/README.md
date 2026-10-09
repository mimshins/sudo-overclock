# Changesets

Each file here describes one pending change and its semver bump. They are
consumed by the "Version Packages" PR, which bumps `package.json`, writes
`CHANGELOG.md`, and — once merged — tags `vX.Y.Z` and creates a GitHub
Release.

```sh
pnpm changesets:create   # describe a reader-visible change and pick the bump
pnpm changesets:empty    # internal-only code change (refactors, tooling, tests)
pnpm changesets:status   # what is pending
```

Posts, `docs/`, `decisions/`, `rfcs/`, `.ai/`, and CI need no changeset at
all. What counts as major / minor / patch is defined in
[`docs/runbook.md#release`](../docs/runbook.md#release) and
[ADR-009](../decisions/ADR-009-changesets-semver-releases.md).
