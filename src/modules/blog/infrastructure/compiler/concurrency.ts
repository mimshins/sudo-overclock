/*
 * CPU-bound work limiting for the content compiler.
 *
 * The compiler has two nested units of work: compiling a post (read, parse,
 * highlight, stringify) and encoding its images. Both are CPU-bound and both
 * must be bounded or a large corpus fans out into unbounded promises and memory.
 *
 * Image encoding runs through libvips (behind `sharp`), which parallelizes a
 * single operation across cores, so roughly half as many concurrent encodes as
 * cores is the sweet spot; `SOC_IMAGE_CONCURRENCY` overrides it. Post-level work
 * is mostly synchronous main-thread JS, so it is bounded at one post per core.
 * The two limiters are independent — a post waiting on an encode does not hold
 * an encode slot, so nesting them cannot deadlock.
 */

import { availableParallelism } from "node:os";

type Limiter = <T>(task: () => Promise<T>) => Promise<T>;

const ENCODE_CONCURRENCY_ENV = "SOC_IMAGE_CONCURRENCY";

const parsePositiveInteger = (raw: string | undefined): number | undefined => {
  const trimmed = raw?.trim();

  if (trimmed === undefined || !/^\d+$/u.test(trimmed)) {
    return undefined;
  }

  const parsed = Math.trunc(Number(trimmed));

  return parsed > 0 ? parsed : undefined;
};

/**
 * Resolves how many image encodes may run at once. libvips spreads a single
 * operation across cores, so roughly half as many concurrent operations keeps
 * total thread demand near the core count.
 */
const resolveEncodeLimit = (): number => {
  const override = parsePositiveInteger(process.env[ENCODE_CONCURRENCY_ENV]);

  if (override !== undefined) {
    return override;
  }

  return Math.max(1, Math.floor(availableParallelism() / 2));
};

/**
 * Resolves how many posts may compile at once. Post compilation is
 * main-thread-bound, so one per core is the sensible ceiling.
 */
const resolvePipelineLimit = (): number => Math.max(1, availableParallelism());

const createLimiter = (limit: number): Limiter => {
  const capacity = Math.max(1, Math.floor(limit));
  let active = 0;
  const waiters: (() => void)[] = [];

  return async <T>(task: () => Promise<T>): Promise<T> => {
    if (active >= capacity) {
      await new Promise<void>(resolve => {
        waiters.push(resolve);
      });
    }

    active += 1;

    try {
      return await task();
    } finally {
      active -= 1;
      waiters.shift()?.();
    }
  };
};

const withEncodeSlot = createLimiter(resolveEncodeLimit());
const withPipelineSlot = createLimiter(resolvePipelineLimit());

export {
  createLimiter,
  resolveEncodeLimit,
  resolvePipelineLimit,
  withEncodeSlot,
  withPipelineSlot,
  ENCODE_CONCURRENCY_ENV,
};
export type { Limiter };
