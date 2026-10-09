# ADR-013 — Component Testing with Vitest and Testing Library

- **Status:** Accepted
- **Date:** 2026-10-09
- **Topic:** testing
- **RFC:** [RFC-011](../rfcs/archived/RFC-011-component-testing.md)

## Context

Tests ran on `node:test` through `tsx --test` and covered logic only. The
Testing Library packages had been installed since the repository was created but
never wired: there was no React renderer, no DOM environment, and `jest-dom`'s
matchers cannot run under `node:assert`. The one component test compared exact
HTML strings. A design audit had found props that did nothing (`Button` and
`Lead` sizes, `Caption uppercase={false}`, `ListItem as`) and accessibility
defects that behavior tests would have caught.

## Decision

- **Runner:** Vitest with two projects in `vitest.config.ts` — `node`
  (`src/**/*.test.ts`) for logic and `ui` (`src/**/*.test.tsx`, happy-dom) for
  components, with `@testing-library/react`, `user-event`, and `jest-dom`
  matchers registered in `test/setup-dom.ts`. `@repo/*` aliases are mapped
  explicitly; Vite's built-in transform handles the automatic JSX runtime, so no
  React plugin is needed. `pnpm test` runs `vitest run` through wireit.
- **Style:** tests sit beside the code, query by role, accessible name, label,
  or text, and interact through `user-event`; they never assert generated class
  names or exact markup. `data-slot` hooks and ARIA attributes are contracts and
  may be asserted. Next modules are mocked with `vi.mock`; build env is stubbed
  with `vi.stubEnv`.
- **CSS-module contract test:** a static node test fails when a module sets a
  local custom property it never reads, or when a component references a
  `styles.<name>` its module does not define — the class of bug that made size
  and variant props silent no-ops.
- **First wave:** the interactive blog UI (`PostFilter`, `TableOfContents`,
  `CodeCopy`), site chrome (`SiteHeader`, `SiteFooter`, a new `SkipLink`), the
  home page CTAs, and every shared primitive. Fixes landed test-first: button
  sizes (padding and type), `Lead` size, `Caption` case, `ListItem as` and its
  props type, `aria-pressed` on toggle tags, an `aria-hidden` blockquote marker,
  sort-toggle and CTA accessible names, a polite live region for `[ copied ]`,
  and the TOC caption that rendered without a TOC.

## Rationale

Vitest is the standard pairing for Testing Library, runs `jest-dom`, and keeps
one runner for logic and components; the existing tests migrated by changing
imports. happy-dom is faster than jsdom with the fidelity these tests need.
Behavior tests survive markup refactors, and the static contract test covers the
purely visual props a DOM environment cannot observe.

## Consequences

- 26 test files, 152 tests at adoption; components now have behavior coverage.
- New devDependencies: `vitest`, `vite`, `happy-dom`, `@testing-library/react`.
- Every button now has a padded hit area (`sm`/`md`/`lg`); text sizes match what
  each button rendered before except `lg`, which was unused.
- Playwright (visual and real-browser checks) remains a possible later layer.
