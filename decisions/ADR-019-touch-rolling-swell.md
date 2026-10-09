# ADR-019 — Rolling Swell on Touch Screens

- **Status:** Accepted
- **Date:** 2026-10-09
- **Topic:** design
- **RFC:** waived by the author, who rejected the first touch treatment and
  chose this one directly in review. Amends principle 6 of
  `docs/design-language.md` (snap motion, no slow easing) with a scoped
  exception for the background field.

## Context

The home page's `PhosphorField` lights dots toward phosphor under the pointer.
Touch screens have no hover, so the effect never showed there, and the pointer
listeners did nothing. The author asked for the hover glow to be disabled on
touch devices and replaced by something that changes dot colours "as if they're
being hovered", smoothly. The design language allows only snap motion (80–150 ms
interaction feedback, no slow easing) and the design system allows only loading
affordances as long-running animation; the field's slow drift was already an
unstated exception.

## Decision

- Devices that do not match `(hover: hover) and (pointer: fine)` get no pointer
  glow. Instead a **rolling swell** lights the field: a train of crests rolls
  across it (mostly downward, slanted, heading randomised per mount), about one
  crest every 7.5 s. Each crest bends and thickens along its length; a dot
  lights while the crest is within its own jittered reach, so the edge dithers
  rather than fades, and the field's existing easing leaves an afterglow.
- Pointer devices keep the pointer glow; the mode follows the media query live.
- **Reduced motion turns it off**, like every other field motion: under
  `prefers-reduced-motion: reduce` the field renders statically.
- Principle 6 and the design-system motion rules name the background field's
  drift and the swell as the one exception to "no slow easing" and "no
  long-running animation". The exception covers the background field only.

## Options considered

| Option                     | Outcome                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Random ghost hovers        | Built first: a few ghost sources appeared at random, swelled, drifted, and faded. Rejected by the author: "isn't good".         |
| **Rolling swell** (chosen) | One coherent shape that travels with a rhythm; reads as a slow beam sweep with phosphor afterglow, which fits the CRT identity. |
| No glow on touch           | Keeps the motion rules untouched, but leaves the home field inert on most visits.                                               |

## Rationale

Random blobs read as noise because nothing connects them. A travelling crest is
one legible shape with direction and rhythm, and its dithered edge and afterglow
reuse the field's own reach jitter and easing, so it looks like the hover glow
rather than a new effect. Scoping the exception to the background keeps
interaction feedback snappy everywhere else.

## Consequences

- The exception is narrow: new UI motion still follows principle 6; only
  `PhosphorField` may run slow continuous motion, and only with a reduced-motion
  path.
- Tuning (period, spacing, crest width, bends) lives in constants at the top of
  `src/shared/ui/phosphor-field-ambient.ts`.
- Touch devices now run the field's lit-layer loop every frame on the home page;
  the procedural field is sparse, so the cost is small.
