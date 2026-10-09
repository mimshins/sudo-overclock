# ADR-017 — Front Matter on `yaml`; Overrides for Vulnerable Transitive Dependencies

- **Status:** Accepted
- **Date:** 2026-10-09
- **Topic:** tooling / dependencies
- **RFC:** waived by the author, who chose to replace gray-matter after the
  failing Dependabot security run (options below).

## Context

GitHub's Dependabot security job failed on 2026-10-09 with
`security_update_not_possible` for five transitive packages: `brace-expansion`,
`shell-quote`, `source-map-js`, `tinypool`, and `sprintf-js`. Dependabot only
updates a sub-dependency when its parent's range allows the fix, and here none
did. `sprintf-js` has no patched release; it arrived through `gray-matter`
(unmaintained since 2021) → `js-yaml@3` → `argparse@1`. The compiler and the
authoring CLI used gray-matter only to split YAML front matter from markdown and
to write it back on publish. `del` was a dev dependency nothing imported.

## Decision

- **Front matter.** `src/modules/blog/infrastructure/frontmatter.ts` splits and
  joins the block itself and parses it with the maintained `yaml` package (dev
  dependency, YAML 1.2 core schema). The compiler narrows the parsed values to
  strings instead of trusting them, and unquoted dates now stay strings (js-yaml
  3 turned them into `Date` objects). Compiled output is byte-identical for the
  existing post. `gray-matter` is removed.
- **Overrides.** `pnpm-workspace.yaml` forces patched ranges for the other four
  (`brace-expansion@1` ^1.1.21, `shell-quote` ^1.11.0, `source-map-js` ^1.2.2,
  `tinypool` ^2.1.2). pnpm 10 ignores the `pnpm` field in `package.json`, so the
  overrides live in the workspace file. Drop each one once its parents' ranges
  include the fix.
- **Cleanup.** `del` is removed.

## Options considered

| Question     | Chosen                          | Also considered                               |
| ------------ | ------------------------------- | --------------------------------------------- |
| `sprintf-js` | replace gray-matter with `yaml` | override the other four and dismiss the alert |
| Overrides    | ranges in `pnpm-workspace.yaml` | exact pins; wait for upstream                 |

## Rationale

Replacing a ten-line use of an unmaintained library removes the vulnerable chain
for good instead of muting it, and makes front-matter types honest. Ranges let
later installs take further fixes without editing the overrides.

## Consequences

- `pnpm audit` still reports `braces@3.0.3` (through stylelint, wireit, and
  shx): no patched release exists. It runs only on the repo's own glob patterns
  at dev time.
- `shell-quote` 1.11.0+ and `source-map-js` 1.2.2 were under two weeks old when
  adopted; both are dev-time only.
- The `compile` task lists `frontmatter.ts` among its inputs.
