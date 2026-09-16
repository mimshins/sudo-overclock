# 004 — Compiler Pipeline: Lazy Shiki Grammars + Bounded Scheduler

- **Date:** 2026-09-16
- **Topic:** blog / content pipeline
- **RFC:**
  [`.ai/rfc/006-compiler-pipeline-scheduling.md`](../../rfc/006-compiler-pipeline-scheduling.md)

## Context

After RFC 005 bounded image encoding, two compiler-wide concerns remained: post
compilation ran through an unbounded `Promise.all` over all markdown files, and
Shiki eagerly loaded all 22 grammars at startup. Measurement showed the
markdown/Shiki stage is only ~2 ms per post and that the compiler is ~97% image
encoding, so adding pipeline parallelism would optimize a rounding error — and
since remark/rehype/Shiki are synchronous main-thread work, `Promise.all` over
posts does not parallelize them at all (24 serial runs and 24 concurrent runs
both took 40 ms). Eager grammar loading, by contrast, was avoidable overhead: 61
ms and 35.6 MB versus 25 ms and 11 MB with no grammars.

## Decision

- **Lazy Shiki grammars.** `getHighlighter` is created with `langs: []`. Before
  compiling each post, `collectFenceLanguages` scans its fences (```and ~~~),
  lowercases, resolves aliases via the existing`LANG_ALIASES`, and
  de-duplicates; `loadSupportedLanguages` then loads only the supported,
  not-yet-loaded ones, sequentially. Unsupported languages are skipped.
- **Bounded post scheduler.** `concurrency.ts` now exports `withPipelineSlot`
  (limit `availableParallelism()`) next to `withEncodeSlot`
  (`max(1, floor(cores/2))`, `SOC_IMAGE_CONCURRENCY` override), and `compile.ts`
  wraps each `compileOnePost` in `withPipelineSlot`. The limiters are
  independent, so a post awaiting an encode slot cannot deadlock.

## Rationale

The fence scan is cheap and keeps cold start and grammar memory proportional to
the content actually used. Bounding post fan-out is a memory/robustness fix for
a growing corpus, not a speed optimization. Worker-thread parallelism, a
two-phase restructure, and incremental compilation were considered and rejected
or deferred (see RFC 006) because the markdown stage is 3% of compile time. The
output is unchanged: supported-language highlighting is byte-identical and only
the supported-language list gates loading.

## Consequences

- Cold start 61 → 25 ms and grammar heap 35.6 → 11 MB on the measured run; both
  scale with languages used rather than the supported list.
- Post-level memory is bounded on a large corpus.
- No throughput claim on the image-dominated path.
- New tests: `shiki.test.ts` (lazy load + skip unsupported) and
  `pipeline.test.ts` cases for `collectFenceLanguages`; `concurrency.test.ts`
  covers the pipeline limit.
- Watch: `collectFenceLanguages` and `rehypeShiki` must keep using the same
  `LANG_ALIASES` map, or a fenced language could highlight without being loaded.
  Worker threads and incremental compilation remain documented future work.
