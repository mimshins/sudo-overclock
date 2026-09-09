import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  IMAGE_STYLE,
  PROCEDURAL_STYLE,
  createDotField,
  stepField,
  type DotField,
} from "./phosphor-field-core.ts";
import { buildLevelColors } from "./phosphor-field-render.ts";

const dotCenter = (
  field: DotField,
  index: number,
): readonly [number, number] => {
  const col = index % field.cols;
  const row = Math.trunc(index / field.cols);
  return [
    col * field.pitch + field.offsetX[index]!,
    row * field.pitch + field.offsetY[index]!,
  ];
};

describe("buildLevelColors", () => {
  it("ramps from the base color to phosphor across STEP_COUNT + 1 steps", () => {
    const colors = buildLevelColors([140, 140, 140], [0, 255, 156]);

    assert.equal(colors.length, 7);
    assert.equal(colors[0], "rgb(140, 140, 140)");
    assert.equal(colors.at(-1), "rgb(0, 255, 156)");
  });
});

describe("createDotField", () => {
  it("returns null when there is no area to cover", () => {
    assert.equal(createDotField(0, 100, PROCEDURAL_STYLE, null), null);
    assert.equal(createDotField(100, 0, PROCEDURAL_STYLE, null), null);
  });

  it("is deterministic for the same dimensions and style", () => {
    const a = createDotField(320, 160, PROCEDURAL_STYLE, null)!;
    const b = createDotField(320, 160, PROCEDURAL_STYLE, null)!;

    assert.deepEqual(Array.from(a.active), Array.from(b.active));
    assert.deepEqual(Array.from(a.blocked), Array.from(b.blocked));
    assert.deepEqual(Array.from(a.radius), Array.from(b.radius));
  });

  it("stays within the configured grid for procedural dots", () => {
    const field = createDotField(320, 160, PROCEDURAL_STYLE, null)!;

    let lit = 0;
    let blocked = 0;
    for (let i = 0; i < field.active.length; i += 1) {
      if (field.active[i] === 0) continue;
      assert.ok(field.size[i] === 1 || field.size[i] === 2);
      assert.ok(field.alpha0[i]! >= 0.1 && field.alpha0[i]! <= 0.32);
      if (field.blocked[i] === 1) blocked += 1;
      else lit += 1;
    }

    assert.ok(lit > 0);
    assert.ok(blocked > 0);
  });
});

const IMAGE_W = 100;
const IMAGE_H = 100;

const solidSource = (): Uint8ClampedArray => {
  const data = new Uint8ClampedArray(IMAGE_W * IMAGE_H * 4);
  for (let i = 0; i < IMAGE_W * IMAGE_H; i += 1) {
    data[i * 4] = 10;
    data[i * 4 + 1] = 20;
    data[i * 4 + 2] = 30;
    data[i * 4 + 3] = 255;
  }
  return data;
};

describe("image sampling without grain", () => {
  it("copies the sampled color verbatim into every active dot", () => {
    const field = createDotField(
      IMAGE_W,
      IMAGE_H,
      { ...IMAGE_STYLE, grain: 0 },
      {
        width: IMAGE_W,
        height: IMAGE_H,
        data: solidSource(),
      },
    )!;

    let seen = false;
    for (let i = 0; i < field.active.length; i += 1) {
      if (field.active[i] === 0) continue;
      seen = true;
      assert.equal(field.rgb![i * 3], 10);
      assert.equal(field.rgb![i * 3 + 1], 20);
      assert.equal(field.rgb![i * 3 + 2], 30);
      assert.equal(field.fill![i], "rgb(10, 20, 30)");
    }
    assert.ok(seen);
  });
});

describe("image sampling with grain", () => {
  it("scatters dot colors within the style bounds", () => {
    const field = createDotField(IMAGE_W, IMAGE_H, IMAGE_STYLE, {
      width: IMAGE_W,
      height: IMAGE_H,
      data: solidSource(),
    })!;

    const values = new Set<number>();
    let seen = false;
    for (let i = 0; i < field.active.length; i += 1) {
      if (field.active[i] === 0) continue;
      seen = true;
      const r = field.rgb![i * 3]!;
      const g = field.rgb![i * 3 + 1]!;
      const b = field.rgb![i * 3 + 2]!;
      assert.ok(r >= 8 && r <= 12, `r=${r} outside grain bounds`);
      assert.ok(g >= 15 && g <= 25, `g=${g} outside grain bounds`);
      assert.ok(b >= 23 && b <= 37, `b=${b} outside grain bounds`);
      assert.equal(field.fill![i], `rgb(${r}, ${g}, ${b})`);
      values.add(r);
    }
    assert.ok(seen);
    assert.ok(values.size > 1, "expected more than one distinct shaded value");
  });
});

describe("stepField", () => {
  it("lights an unblocked dot at the pointer and leaves blocked dots dark", () => {
    const field = createDotField(320, 160, PROCEDURAL_STYLE, null)!;

    let lit = -1;
    let blocked = -1;
    for (let i = 0; i < field.active.length; i += 1) {
      if (field.active[i] === 0) continue;
      if (lit === -1 && field.blocked[i] === 0) lit = i;
      if (blocked === -1 && field.blocked[i] === 1) blocked = i;
      if (lit !== -1 && blocked !== -1) break;
    }
    assert.ok(lit !== -1 && blocked !== -1);

    const [px, py] = dotCenter(field, lit);
    stepField(field, 10, 1, px, py);

    assert.equal(field.state[lit], 1);
    assert.equal(field.state[blocked], 0);
  });
});
