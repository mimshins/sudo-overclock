import {
  imageGrid,
  paintImageDots,
  paintProceduralDots,
  quietKeep,
  type Canvas,
  type DotStyle,
} from "@repo/shared/lib/dot-painter";
import { describe, expect, it } from "vitest";

const STYLE: DotStyle = {
  pitch: 4,
  skip: 0.01,
  sizeMin: 2,
  sizeMax: 4,
  alphaMin: 0.82,
  alphaMax: 1,
  grain: 0.18,
  radiusMin: 0.55,
  radiusMax: 1.9,
};

const canvas = (quietKeepRatio = 1): Canvas => ({
  width: 40,
  height: 20,
  background: [10, 10, 10],
  quiet: {
    left: 0,
    top: 0,
    right: 20,
    bottom: 20,
    keep: quietKeepRatio,
    feather: 4,
  },
});

const solidSource = (width: number, height: number) => {
  const { cols, rows } = imageGrid(width, height, STYLE.pitch);
  return { cols, rows, data: new Uint8Array(cols * rows * 4).fill(200) };
};

const litPixels = (pixels: Uint8ClampedArray, fromX: number, toX: number) => {
  let lit = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const x = (i / 4) % 40;
    if (x >= fromX && x < toX && pixels[i]! > 10) lit += 1;
  }
  return lit;
};

const sum = (pixels: Uint8ClampedArray): number =>
  pixels.reduce((total, value) => total + value, 0);

describe("imageGrid", () => {
  it("covers the area with one cell per pitch, rounding up", () => {
    expect(imageGrid(41, 20, 4)).toEqual({ cols: 11, rows: 5 });
  });
});

describe("quietKeep", () => {
  it("is full outside the zone, `keep` inside, and ramps across the feather", () => {
    const { quiet } = canvas(0.2);

    expect(quietKeep(quiet, 30, 10)).toBe(1);
    expect(quietKeep(quiet, 10, 10)).toBeCloseTo(0.2);
    expect(quietKeep(quiet, 22, 10)).toBeCloseTo(0.6);
  });
});

describe("paintImageDots", () => {
  it("paints an opaque RGBA buffer the size of the canvas", () => {
    const pixels = paintImageDots(canvas(), solidSource(40, 20), STYLE);

    expect(pixels).toHaveLength(40 * 20 * 4);
    expect(pixels[3]).toBe(255);
    expect(litPixels(pixels, 0, 40)).toBeGreaterThan(0);
  });

  it("is deterministic", () => {
    const source = solidSource(40, 20);

    expect(paintImageDots(canvas(), source, STYLE)).toEqual(
      paintImageDots(canvas(), source, STYLE),
    );
  });

  it("brightens the sampled tone by the gain", () => {
    const source = solidSource(40, 20);

    expect(sum(paintImageDots(canvas(), source, STYLE, 1.2))).toBeGreaterThan(
      sum(paintImageDots(canvas(), source, STYLE)),
    );
  });

  it("thins dots inside the quiet zone", () => {
    const pixels = paintImageDots(canvas(0), solidSource(40, 20), STYLE);

    expect(litPixels(pixels, 0, 16)).toBe(0);
    expect(litPixels(pixels, 26, 40)).toBeGreaterThan(0);
  });
});

describe("paintProceduralDots", () => {
  it("lights dots toward the ink near the patch only", () => {
    const pixels = paintProceduralDots(
      { ...canvas(), width: 200, height: 20 },
      { ...STYLE, pitch: 8, skip: 0.24, alphaMin: 0.14, alphaMax: 0.4 },
      [100, 100, 100],
      [0, 255, 0],
      { x: 180, y: 10, radius: 12 },
    );
    const greenest = (fromX: number, toX: number): number => {
      let best = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const x = (i / 4) % 200;
        if (x >= fromX && x < toX) {
          best = Math.max(best, pixels[i + 1]! - pixels[i]!);
        }
      }
      return best;
    };

    expect(greenest(160, 200)).toBeGreaterThan(greenest(40, 120));
  });
});
