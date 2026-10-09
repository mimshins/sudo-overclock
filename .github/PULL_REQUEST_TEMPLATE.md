## What and why

<!-- One logical change. Link the spec, RFC, ADR, or issue it implements. -->

## How it was verified

<!-- Commands run (pnpm check:lint, pnpm test, pnpm build) and results; screenshots for UI. -->

## Definition of done

- [ ] `pnpm check:lint` and `pnpm test` pass; `pnpm build` passes when the
      compiler, content, or app changed.
- [ ] Layer rules hold (no peer-module imports, inner layers never import outer
      ones, no new barrel files).
- [ ] UI uses semantic tokens only (no raw values outside `globals.css`),
      `data-slot` on every `className` layer, ASCII affordances, focus-visible
      and reduced-motion handled.
- [ ] Docs match the change (`docs/`, `README.md`, `CONTRIBUTING.md`) —
      knowledge drift sync done.
- [ ] Shipped RFCs have an ADR in `decisions/` and are moved to
      `rfcs/archived/`; indexes updated.
- [ ] A changeset is included (or an empty one for internal-only work) when
      code, public assets, build config, or dependencies changed.
- [ ] A new runtime `dependencies` entry has an ADR.
- [ ] `.ai/memories/` updated where orientation changed; linked working memories
      resolved.
- [ ] New behavior has tests.
- [ ] No secrets, tokens, or private hostnames; no hand-edited generated output.

See [`AGENTS.md`](../AGENTS.md) for the mandatory actions and
[`CONTRIBUTING.md`](../CONTRIBUTING.md) for the workflow.
