# ADR-010 — Design System Foundations: Root Size, Chrome, Status, Imagery, Enforcement

- **Status:** Accepted
- **Date:** 2026-10-09
- **Topic:** design
- **RFC:** waived by the author, who decided each option directly in a design
  review on 2026-10-09 (options below). The light theme is proposed separately
  in [RFC-010](../rfcs/active/RFC-010-paper-crt-light-theme.md).

## Context

A design-system audit (2026-10-09) found the identity in
`docs/design-language.md` and the code disagreeing in several places: a 15px
root made every `rem` token render 6.25% small, so the "4px grid" and integer
line heights did not hold; leaders used em dashes where the design language
specifies box-drawing characters, and were copy-pasted in seven places; the
`.scanlines` and glitch utilities were unused and there was no 404 page; full
status-hue ramps existed while the design language said status maps to neutrals;
nothing enforced the token rules; and imagery had no written direction beyond a
few asset notes.

## Decision

0. **The design system is project knowledge.** `docs/design-system.md` makes the
   identity in `docs/design-language.md` implementable: token layers, rules per
   foundation, patterns, extension rules, a conformance checklist, and an honest
   list of known deviations. `docs/imagery.md` does the same for images. A
   designer agent and a `design-a-feature` skill apply both.
1. **16px root.** The root is the browser default; body text stays 15px via the
   body1 token on `body`. Spacing lands on the 4px grid and line heights on
   integers.
2. **Box-drawing chrome.** Leaders use U+2500 (`──── name.md ────`) through a
   shared `Leader` primitive; panels keep 1px CSS borders.
3. **Scanlines and glitch have a home.** Both utilities stay and are used on the
   new 404 page; glitch stays one-shot (never looping) and is disabled under
   reduced motion. Button hover glitch is unchanged.
4. **Distinct status hues.** Rust, amber, and cyan ramps stay, for status only
   (errors, warnings, info, success) and always paired with a label or glyph;
   phosphor remains the single accent.
5. **Imagery direction.** Images use pixel art, pointillism (dotted), duo-color
   (one phosphor ink on the dark ground), and abstract structure, as defined in
   `docs/imagery.md`.
6. **Enforcement.** stylelint (core rules only) runs in `check:lint`, the
   pre-push hook, and CI: no hex, named colors, color functions, `color-mix`,
   primitive color tokens, or raw durations outside `src/app/globals.css` (five
   files keep existing `color-mix` tints until a glass-panel recipe exists).
   Length rules follow once the missing tokens (letter-spacing, weights, border
   widths) exist.

## Options considered

Presented to the author in the design review; the chosen option is first.

| Question         | Chosen                        | Also considered                              |
| ---------------- | ----------------------------- | -------------------------------------------- |
| Root size        | 16px root, body text 15px     | keep the 15px root and document it           |
| Leaders          | box-drawing `──` via `Leader` | keep em dashes                               |
| Scanlines/glitch | adopt on a new 404 page       | remove both utilities; keep them unused      |
| Status colors    | distinct hues, status only    | collapse to neutrals + opacity               |
| Enforcement      | stylelint                     | rely on the checklist and review             |
| Light theme      | revive via an RFC (RFC-010)   | remove the dormant values; keep them dormant |

## Rationale

Each choice resolves a doc/code conflict in the direction of the stated identity
where that identity is coherent (16px grid, box-drawing ASCII chrome,
scanlines/glitch on 404), and in the direction of the code where the code is the
better design (status hues are more legible than opacity alone). A linter turns
the most frequently drifting rules into a failing check instead of a review
comment.

## Consequences

- Everything sized in `rem` renders ~6.7% larger after the root change; spacing
  tokens now match their documented pixel values.
- `docs/design-language.md` and `docs/design-system.md` are updated to match;
  known deviations shrink.
- stylelint is a new devDependency; its rules widen as tokens are added.
- The light theme stays out of scope until RFC-010 is decided.
