# 005 — Compiler Image Encoding Concurrency

- **Status:** Implemented
- **Date:** 2026-09-16
- **Supersedes:** —
- **Superseded by:** —

## Context

[RFC 004](./004-post-asset-pipeline.md) introduced build-time image encoding
(AVIF + WebP + fallback) and bounded it with a hardcoded
`MAX_CONCURRENT_ENCODES = 4` in `infrastructure/compiler/image-optimizer.ts`.
Two things prompted a re-look:

- The fixed `4` was chosen by intuition, not measurement, and does not adapt to
  the machine. On GitHub's standard 4-vCPU (sometimes 2-vCPU) runner, four
  concurrent encodes with libvips' own thread pool oversubscribe the CPU.
- The AVIF/WebP/fallback encodes for one image are partially serialized — AVIF
  is awaited before WebP and the fallback start — which leaves encode slots idle
  when a post has few images.

libvips is already internally multithreaded (`sharp.concurrency()` defaults to a
core-derived value; `5` on the 11-core dev machine), so raw ops-level
parallelism is not the lever one might assume.

## Options

### Option A — Adaptive ops limit + parallel per-image encodes

- **Pros:** Removes the magic number; matches concurrency to the host so CI does
  not oversubscribe. Encoding the three formats concurrently via `sharp.clone()`
  improves queue depth without extra input memory. No output or URL change.
- **Cons:** Adds a small scheduling helper; the formula is a heuristic.

### Option B — Fixed limit, larger constant

- **Pros:** One-line change.
- **Cons:** Ignores the measurement (more concurrency was slower) and still
  oversubscribes small runners.

### Option C — `sharp.concurrency(1)` + one worker per core

- **Pros:** Simple mental model.
- **Cons:** **Measured 2× slower** (9.9s vs 5.4s) — libvips' internal threading
  is essential for AVIF.

### Option D — Leave as-is; document

- **Pros:** Zero risk; the current setting is already near-optimal on the
  11-core dev machine (~8.4× effective parallelism).
- **Cons:** Still wrong on small runners; leaves the per-image serialization.

## Decision

Adopt **Option A**.

Measurements on an Apple M3 Pro (11 cores; 9 AVIF encodes per run; effective
parallelism from `process.cpuUsage`):

| ops limit × libvips threads | wall | effective parallelism |
| --------------------------- | ---- | --------------------- |
| **4 × 5 (current)**         | 5.4s | 8.4×                  |
| 6 × 5                       | 5.7s | 8.0×                  |
| 8 × 5                       | 6.9s | 6.8×                  |
| 11 × 5                      | 8.0s | 6.1×                  |
| 11 × 11                     | 5.6s | 8.5×                  |
| 4 × 1                       | 9.9s | —                     |

The workload saturates around eight effective cores; pushing the ops limit
higher oversubscribes and slows the build. The change is therefore **not** "more
parallelism" but **hardware-aware** parallelism:

1. Derive the concurrent-encode limit from `os.availableParallelism()` as
   `max(1, floor(cores / 2))` — libvips already spreads a single operation
   across cores, so roughly half as many concurrent operations keeps total
   threads near the core count. (11→5, 4→2, 2→1.) An `SOC_IMAGE_CONCURRENCY` env
   var overrides it for tuning.
2. Encode AVIF, WebP, and the fallback **concurrently** from a shared
   `sharp(source).rotate().resize(...)` pipeline via `.clone()`, so the first
   images in a small post keep the slots busy. AVIF's output supplies the
   intrinsic dimensions.
3. Keep libvips' default internal concurrency; rely on the ops limit as the
   single throttle.

There is **no measurable speed-up on the 11-core dev machine** and this RFC does
not claim one; the win is predictable behavior on 2–4 core CI runners and
removal of a hand-tuned constant. The encoded bytes and hashed URLs are
unchanged.

## Consequences

- Concurrency scales with the host instead of a magic `4`; CI no longer
  oversubscribes.
- Per-image encoding is fully parallel, with bounded total memory (the limiter
  still caps in-flight operations and `.clone()` shares the decoded input).
- A small `concurrency.ts` helper (limiter + limit resolution) is added and unit
  tested; `SOC_IMAGE_CONCURRENCY` becomes the supported tuning knob.
- Output determinism is unaffected: filenames hash the source and transform
  parameters, not encoder scheduling.
- Recorded in `.ai/memory/blog/003-image-encode-concurrency.md`.
