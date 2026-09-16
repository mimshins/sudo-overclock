import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createLimiter,
  resolveEncodeLimit,
  resolvePipelineLimit,
  ENCODE_CONCURRENCY_ENV,
} from "./concurrency.ts";

describe("createLimiter", () => {
  it("never runs more than `limit` tasks at once and settles all of them", async () => {
    const limit = createLimiter(2);
    let active = 0;
    let peak = 0;

    const results = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        limit(async () => {
          active += 1;
          peak = Math.max(peak, active);
          await new Promise<void>(resolve => {
            setTimeout(resolve, 5);
          });
          active -= 1;

          return index;
        }),
      ),
    );

    assert.equal(peak, 2);
    assert.deepEqual(results, [0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("treats a non-positive limit as one", async () => {
    const limit = createLimiter(0);
    let active = 0;
    let peak = 0;

    await Promise.all(
      Array.from({ length: 4 }, () =>
        limit(async () => {
          active += 1;
          peak = Math.max(peak, active);
          await new Promise<void>(resolve => {
            setTimeout(resolve, 5);
          });
          active -= 1;
        }),
      ),
    );

    assert.equal(peak, 1);
  });
});

describe("resolveEncodeLimit", () => {
  it("honours a positive integer override", () => {
    const previous = process.env[ENCODE_CONCURRENCY_ENV];
    process.env[ENCODE_CONCURRENCY_ENV] = "3";

    try {
      assert.equal(resolveEncodeLimit(), 3);
    } finally {
      if (previous === undefined) {
        Reflect.deleteProperty(process.env, ENCODE_CONCURRENCY_ENV);
      } else {
        process.env[ENCODE_CONCURRENCY_ENV] = previous;
      }
    }
  });

  it("falls back to the derived limit for invalid overrides", () => {
    const previous = process.env[ENCODE_CONCURRENCY_ENV];
    process.env[ENCODE_CONCURRENCY_ENV] = "not-a-number";

    try {
      assert.ok(resolveEncodeLimit() >= 1);
    } finally {
      if (previous === undefined) {
        Reflect.deleteProperty(process.env, ENCODE_CONCURRENCY_ENV);
      } else {
        process.env[ENCODE_CONCURRENCY_ENV] = previous;
      }
    }
  });

  it("derives a limit of at least one without an override", () => {
    const previous = process.env[ENCODE_CONCURRENCY_ENV];
    Reflect.deleteProperty(process.env, ENCODE_CONCURRENCY_ENV);

    try {
      assert.ok(resolveEncodeLimit() >= 1);
    } finally {
      if (previous !== undefined) {
        process.env[ENCODE_CONCURRENCY_ENV] = previous;
      }
    }
  });
});

describe("resolvePipelineLimit", () => {
  it("is at least one", () => {
    assert.ok(resolvePipelineLimit() >= 1);
  });
});
