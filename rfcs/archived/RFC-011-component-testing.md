# RFC-011 — Component Testing with Vitest and Testing Library

- **Status:** Implemented
- **Date:** 2026-10-09
- **Supersedes:** —
- **Superseded by:** —

## Context

Tests run on `node:test` through `tsx --test` (12 files, 89 tests). They cover
logic only — compiler, authoring CLI, image store, phosphor-field maths.
`@testing-library/dom`, `@testing-library/jest-dom`, and
`@testing-library/user-event` have been devDependencies since the repository was
initialized but were never wired: there is no `@testing-library/react`, no DOM
environment, and `jest-dom`'s matchers need a Jest/Vitest `expect`, which
`node:test` + `node:assert` cannot provide.

The one component test (`src/shared/ui/leader.test.ts`) renders with
`renderToStaticMarkup` behind a hand-written CSS-module loader hook and asserts
exact HTML strings — coupled to markup details rather than behavior.

Untested interactive UI: `PostFilter` (tag toggles, sort), `TableOfContents`
(scroll-spy, `aria-current`), `CodeCopy` (`[ copy ]` → `[ copied ]`), the
`SiteHeader` mobile menu (`aria-expanded`, Esc, focus return). The design audit
also found accessibility defects (duplicate `read more` labels, a sort toggle
that hides its state, an unannounced `[ copied ]`, filter tags without
`aria-pressed`) and no-op props (`Button` `size`, `Lead` `size`, `Caption`
`uppercase={false}`, `ListItem` `as`) that behavior tests would have caught.

## Options

### Option A — Vitest + React Testing Library (two projects)

Migrate to Vitest; a `node` project for logic and a `happy-dom` project for
components; `@testing-library/react`, `user-event`, and `jest-dom` matchers.

- **Pros:** the standard pairing for RTL; `jest-dom` works; CSS Modules handled
  by Vite; one runner; watch mode and filtering built in.
- **Cons:** migrating 12 files (mechanical: `node:test` imports → `vitest`;
  `node:assert` keeps working); Vite becomes part of the test toolchain.

### Option B — Keep node:test, add RTL through a setup module

- **Pros:** no runner change.
- **Cons:** custom glue for DOM globals and CSS modules; no `jest-dom`; weaker
  ergonomics (no watch filtering, snapshot, or fake-timer helpers in the same
  shape the RTL docs assume).

### Option C — Playwright component or end-to-end tests

- **Pros:** a real browser; visual and accessibility snapshots possible.
- **Cons:** slower and heavier; still needs a unit runner for logic; better as a
  later layer on top of A.

## Decision

**Option A**, chosen by the author on 2026-10-09, with **happy-dom** as the DOM
environment.

- `vitest.config.ts` with two projects: `node` (`*.test.ts` outside UI folders)
  and `ui` (`*.test.tsx`, `environment: "happy-dom"`, `setupFiles` registering
  `@testing-library/jest-dom/vitest` and RTL `cleanup`). CSS Modules resolve to
  their class names.
- Tests query by role, label, and text (`getByRole`) and interact with
  `user-event`; no assertions on class names or exact markup, except `data-slot`
  hooks that are part of the public contract.
- The wireit `test` script runs `vitest run`; its `files` cover `src/**`,
  `vitest.config.ts`, and test setup.
- New devDependencies: `vitest`, `@testing-library/react`, `happy-dom` (and
  `@vitejs/plugin-react` only if JSX transform needs it).

### First wave (author's scope)

1. **Interactive blog UI:** `PostFilter`, `TableOfContents`, `CodeCopy`.
2. **Site chrome:** `SiteHeader` menu, nav `aria-current`, skip link.
3. **Shared primitives:** every variant/size prop asserts a visible effect; the
   known no-op props get failing tests first, then fixes.
4. **Accessibility fixes, test-first:** distinct accessible names for the home
   CTAs, sort-toggle state, a live region for `[ copied ]`, `aria-pressed` on
   filter tags.

## Task breakdown

1. Add dependencies; `vitest.config.ts`; `test/setup-dom.ts`; switch the wireit
   `test` script; keep `pnpm test` the single entry point.
2. Migrate the 12 `node:test` files (imports and hook names); rewrite the
   `Leader` test with RTL; delete the CSS loader hook.
3. Wave 1–2: blog UI and site-chrome behavior tests.
4. Wave 3: primitive variant tests; fix `Button` `size`, `Lead` `size`,
   `Caption` `uppercase`, `ListItem` `as`.
5. Wave 4: accessibility fixes driven by failing tests.
6. Docs: `docs/architecture.md` (Testing Strategy), `docs/runbook.md`
   (commands), `docs/components.md` (testing a component),
   `.ai/memories/conventions.md`, the implementer agent; remove fixed items from
   `docs/design-system.md#known-deviations` and the drift working memory.
7. ADR on ship; this RFC moves to `archived/`. Changesets: empty for tooling,
   `patch` for the prop and accessibility fixes.

## Consequences

- Components gain behavior tests that survive markup refactors.
- `jest-dom` and `user-event`, already installed, finally earn their place.
- Vite joins the toolchain for tests only; the app build is unchanged.
- Playwright (Option C) remains a possible later layer for visual checks.

## Resolution

Implemented on 2026-10-09; recorded in
[ADR-013](../../decisions/ADR-013-component-testing.md). The third wave (shared
primitives) also added a static CSS-module contract test that catches the
no-op-prop class of bug the DOM cannot observe.
