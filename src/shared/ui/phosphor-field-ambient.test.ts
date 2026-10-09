import assert from "node:assert/strict";

import { describe, it } from "vitest";

import { createAmbient, stepAmbient } from "./phosphor-field-ambient.ts";
import type { DotTarget } from "./phosphor-field-core.ts";

const seeded = (seed: number) => {
  let value = seed;
  return (): number => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
};

const WIDTH = 390;
const HEIGHT = 844;
const REACH = 56;

const litShare = (target: DotTarget): number => {
  let lit = 0;
  let total = 0;
  for (let y = 0; y < HEIGHT; y += 8) {
    for (let x = 0; x < WIDTH; x += 8) {
      lit += target(x, y, REACH);
      total += 1;
    }
  }
  return lit / total;
};

const litRows = (target: DotTarget, x: number): number[] => {
  const rows: number[] = [];
  for (let y = 0; y < HEIGHT; y += 2) {
    if (target(x, y, REACH) === 1) rows.push(y);
  }
  return rows;
};

const centroid = (rows: readonly number[]): number =>
  rows.reduce((sum, row) => sum + row, 0) / rows.length;

describe("stepAmbient", () => {
  it("lights a crest, not the whole field", () => {
    const state = createAmbient(seeded(7));
    const target = stepAmbient(state, 0, WIDTH, HEIGHT);
    const share = litShare(target);

    assert.ok(share > 0.02, `expected a visible crest, got ${share}`);
    assert.ok(share < 0.3, `expected mostly dark field, got ${share}`);
  });

  it("rolls the crest along its heading at a steady pace", () => {
    const state = createAmbient(seeded(11));
    const target = stepAmbient(state, 0, WIDTH, HEIGHT);
    const x = WIDTH / 2;

    let before = litRows(target, x);
    let after = before;
    let moved = 0;
    for (let frame = 0; frame < 30; frame += 1) {
      before = after;
      stepAmbient(state, 1 / 60, WIDTH, HEIGHT);
      after = litRows(target, x);
      if (before.length > 0 && after.length > 0) {
        const step = centroid(after) - centroid(before);
        if (Math.abs(step) < 20) moved += step;
      }
    }

    assert.ok(moved > 0, "expected the crest to travel downward");
  });

  it("is reproducible for the same seed", () => {
    const a = stepAmbient(createAmbient(seeded(3)), 0.5, WIDTH, HEIGHT);
    const b = stepAmbient(createAmbient(seeded(3)), 0.5, WIDTH, HEIGHT);

    for (let y = 0; y < HEIGHT; y += 16) {
      for (let x = 0; x < WIDTH; x += 16) {
        assert.equal(a(x, y, REACH), b(x, y, REACH));
      }
    }
  });

  it("dithers the crest edge by each dot's reach", () => {
    const state = createAmbient(seeded(5));
    const target = stepAmbient(state, 0, WIDTH, HEIGHT);

    assert.ok(litShare((x, y) => target(x, y, REACH * 1.9)) > litShare(target));
    assert.ok(
      litShare((x, y) => target(x, y, REACH * 0.55)) < litShare(target),
    );
  });
});
