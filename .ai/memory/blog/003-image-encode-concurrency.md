# 003 — Compiler Image Encoding Concurrency

- **Date:** 2026-09-16
- **Topic:** blog / content pipeline
- **RFC:**
  [`.ai/rfc/005-image-encode-concurrency.md`](../../rfc/005-image-encode-concurrency.md)

## Context

RFC 004 added build-time AVIF/WebP encoding with a hardcoded
`MAX_CONCURRENT_ENCODES = 4`. The constant was a guess and did not adapt to the
host, so a 4-vCPU (or 2-vCPU) GitHub Actions runner could oversubscribe. AVIF,
WebP, and the fallback for one image were also partially serialized (AVIF was
awaited before the other two started).

Measurement on an 11-core Apple M3 Pro showed the current setting already
reached ~8.4× effective parallelism (from `process.cpuUsage`), and that raising
the ops count made it slower (4 ops → 5.4s; 11 ops → 8.0s), while
`sharp.concurrency(1)` was ~2× slower (9.9s). libvips already multithreads a
single operation; the lever is matching concurrency to the host, not maximizing
it.

## Decision

Replace the constant with `resolveEncodeLimit()` in
`infrastructure/compiler/concurrency.ts`:
`max(1, floor(availableParallelism() / 2))`, overridable with the
`SOC_IMAGE_CONCURRENCY` env var. Encode the three formats concurrently from one
shared `sharp(source).rotate().resize(...)` pipeline via `.clone()`, all bounded
by a single process-wide promise limiter (`createLimiter`). libvips' internal
concurrency is left untouched.

## Rationale

Hardware-aware sizing removes a magic number and prevents CI oversubscription —
the only place the old value was clearly wrong. Encoding the formats in parallel
improves queue depth when a post has few images. No speed-up is claimed on the
large dev machine; the measured wall time did drop in one run (4.4s → 3.1s) but
hybrid-core variance is high, so the durable win is predictability. The
`.clone()` approach shares the decoded input, and the limiter caps in-flight
operations, so peak memory stays bounded.

## Consequences

- Concurrency scales with the host (11→5, 4→2, 2→1); `SOC_IMAGE_CONCURRENCY`
  tunes it.
- Output is unchanged: filenames are still
  `sha256(source bytes + transform parameters)`, verified byte-identical after
  the change, so scheduling does not affect determinism or cache keys.
- New `concurrency.test.ts` covers the limiter's bound and the limit resolver.
- Watch: the `cores / 2` heuristic is from one machine — use the env override if
  a host behaves differently. libvips concurrency is intentionally not pinned.
