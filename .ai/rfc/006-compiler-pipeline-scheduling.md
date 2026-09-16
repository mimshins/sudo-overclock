# 006 — Compiler Pipeline: Lazy Shiki Grammars + Bounded Scheduler

- **Status:** Implemented
- **Date:** 2026-09-16
- **Supersedes:** —
- **Superseded by:** —

## Context

[RFC 005](./005-image-encode-concurrency.md) bounded image encoding. Two aspects
of the surrounding compiler were still unexamined:

- **Post compilation is unbounded.** `compileAll` maps every markdown file into
  `Promise.all` (`compile.ts:162`), so a large corpus fans out into as many
  concurrent pipelines as there are posts, each holding its markdown and AST in
  memory.
- **Shiki eagerly loads 22 grammars** (`shiki.ts`), even for a site whose posts
  fence two languages.

Measurements on an Apple M3 Pro reframed the problem:

| What                                                     | Time           |
| -------------------------------------------------------- | -------------- |
| Compile 24 markdown posts (parse, GFM, Shiki, stringify) | ~50 ms         |
| 24 pipeline runs serial vs `Promise.all`                 | 40 vs 40 ms    |
| Real `pnpm compile` (1 post, 3 images)                   | ~3,000 ms      |
| Shiki init, lazy (no grammars)                           | 25 ms, 11 MB   |
| Shiki init, eager (22 grammars)                          | 61 ms, 35.6 MB |

Two facts follow. First, the markdown/Shiki stage is ~2 ms/post and the compiler
is ~97% image encoding, so **pipeline-level parallelism buys nothing** — and
because remark/rehype/Shiki are synchronous main-thread work, `Promise.all` over
posts does not parallelize them anyway (the serial and parallel runs are
identical). Second, eagerly loading grammars is pure overhead the content does
not justify.

## Options

### Option A — Lazy Shiki grammars + a bounded post scheduler

- **Pros:** Grammars load on demand, so cold start and memory scale with content
  rather than the supported-language list. Post fan-out is bounded, capping
  memory on a large corpus. No output change; no false parallelism.
- **Cons:** Adds a fence-scanning step per post (negligible); a small scheduler
  module.

### Option B — Worker threads for post compilation

- **Pros:** Genuine CPU parallelism for parse/Shiki.
- **Cons:** At ~2 ms/post the coordination and serialization overhead dominates;
  complexity far outweighs the gain until a corpus is very large.

### Option C — Two-phase refactor (parse all, then encode all)

- **Pros:** Cleaner scheduling isolation between the two stages.
- **Cons:** No measured speed gain; larger structural change for a stage that is
  3% of the time.

### Option D — Incremental compilation

- **Pros:** Largest win for a large, slowly-changing corpus.
- **Cons:** High complexity (content-hash cache, invalidation, asset
  coordination); deferred until the corpus justifies it.

## Decision

Adopt **Option A**, and explicitly reject pipeline parallelism as cargo-cult for
this workload.

1. **Lazy grammars.** `getHighlighter` is created with `langs: []`. Before
   compiling a post, the pipeline scans its fences, alias-resolves and
   de-duplicates them (`collectFenceLanguages`), and loads only the supported
   languages not yet loaded (`loadSupportedLanguages`, sequential to avoid
   concurrent highlighter mutation). Unsupported languages are skipped; combined
   with the existing `rehypeShiki` behavior this preserves current output.
2. **Bounded scheduler.** `concurrency.ts` exposes two independent limiters:
   `withPipelineSlot` (`availableParallelism()`) wrapping each `compileOnePost`,
   and the existing `withEncodeSlot` (`max(1, floor(cores/2))`,
   `SOC_IMAGE_CONCURRENCY` override). They are independent, so a post awaiting
   an encode never holds an encode slot — no deadlock.

## Consequences

- Cold start drops (61 → 25 ms) and grammar memory drops (35.6 → 11 MB) on the
  measured run; both scale with the number of languages actually used.
- Post-level fan-out is bounded, so memory stays predictable as the blog grows.
- No speed claim on the image-dominated path: this is correctness (no unbounded
  fan-out) and cold-start/memory, not throughput.
- Worker threads and incremental compilation remain future work, documented here
  so the "why not" is recorded.
- Recorded in `.ai/memory/blog/004-compiler-pipeline-scheduling.md`.
