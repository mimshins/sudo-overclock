---
name: design-a-feature
description: Use when a feature needs UI — a page, component, variant, interaction, or visual change. Produces a design brief built from the existing design system and runs the conformance checklist so the phosphor/CRT identity does not drift.
---

# design-a-feature

## Prerequisites

- [`docs/design-language.md`](../../../docs/design-language.md) — the identity
  (why).
- [`docs/design-system.md`](../../../docs/design-system.md) — tokens,
  patterns, extension rules, conformance checklist, known deviations (how).
- [`docs/components.md`](../../../docs/components.md) — existing component APIs.
- [`docs/imagery.md`](../../../docs/imagery.md) — imagery and illustration
  (pixel art, pointillism, duo-color, abstract), when the feature has images.

## Workflow

1. Restate the user need and the content the UI must carry.
2. Walk the "How to design a feature" ladder in `docs/design-system.md` and
   stop at the first step that works. Name the primitives and patterns reused.
3. Write the brief (in the spec's "UI / Design" section, or a working memory):
   - layout at desktop and ≤ 640px, and where it sits in the page shell;
   - every state: default, hover, focus-visible, active, disabled, empty,
     loading, error;
   - exact tokens per property (semantic only) and the ASCII affordance text;
   - motion with durations, easing, and the reduced-motion behavior;
   - accessibility: landmarks, accessible names, state attributes, contrast.
4. For each addition (token, variant, component), state why reuse failed and
   where it is documented.
5. Identity-level changes (typeface, accent, theme model, motion character)
   stop here and go to [write-an-rfc](../write-an-rfc/SKILL.md).
6. After implementation, run the conformance checklist against the diff and
   report each item as pass / fail with file:line.

## Constraints

- Never copy a pattern listed under "Known deviations".
- No raw values outside `src/app/globals.css`; no new hue, typeface, or radius
  style without an RFC.
- Do not trade contrast, focus visibility, or reduced motion for looks.

## Expected output

A design brief, or a conformance report with findings ordered by severity.

## References

- [designer agent](../../agents/designer.md),
  [known deviations](../../../docs/design-system.md#known-deviations)
