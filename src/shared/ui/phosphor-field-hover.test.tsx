import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAmbient } from "./phosphor-field-ambient.ts";
import { PROCEDURAL_STYLE, createDotField } from "./phosphor-field-core.ts";
import { HoverAnimator } from "./phosphor-field-hover.ts";

type Listener = (event: Pick<MediaQueryListEvent, "matches">) => void;

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

const mockPointer = (fine: boolean): ((matches: boolean) => void) => {
  const listeners = new Set<Listener>();

  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query === FINE_POINTER ? fine : false,
      addEventListener: (_: string, listener: Listener) => {
        if (query === FINE_POINTER) listeners.add(listener);
      },
      removeEventListener: (_: string, listener: Listener) =>
        listeners.delete(listener),
    })),
  );

  return (matches: boolean) => {
    for (const listener of listeners) listener({ matches });
  };
};

const noop = (): void => undefined;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a no-op proxy stands in for the 2D context happy-dom does not provide
const fakeContext = new Proxy(
  {},
  { get: () => noop },
) as CanvasRenderingContext2D;

let frames: FrameRequestCallback[] = [];

const runFrame = (time: number): void => {
  const pending = frames;
  frames = [];
  for (const frame of pending) frame(time);
};

const animatorWith = (ambient = createAmbient()) =>
  new HoverAnimator({
    canvas: document.createElement("canvas"),
    context: fakeContext,
    baseContext: fakeContext,
    base: [140, 140, 140],
    phosphor: [0, 255, 156],
    levelColors: [],
    ambient,
    onPaint: noop,
  });

const pointerListeners = (spy: {
  readonly mock: { readonly calls: readonly (readonly unknown[])[] };
}): number => spy.mock.calls.filter(call => call[0] === "pointermove").length;

beforeEach(() => {
  frames = [];
  vi.stubGlobal("requestAnimationFrame", (frame: FrameRequestCallback) => {
    frames.push(frame);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", noop);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("HoverAnimator glow source", () => {
  const field = createDotField(320, 200, PROCEDURAL_STYLE, null);

  it("follows a fine hovering pointer", () => {
    mockPointer(true);
    const listen = vi.spyOn(window, "addEventListener");

    animatorWith().start(field, 320, 200, false);

    expect(pointerListeners(listen)).toBe(1);
  });

  it("rolls the swell instead on touch screens", () => {
    mockPointer(false);
    const listen = vi.spyOn(window, "addEventListener");
    const ambient = createAmbient();
    const before = ambient.time;

    animatorWith(ambient).start(field, 320, 200, false);
    runFrame(performance.now() + 16);

    expect(pointerListeners(listen)).toBe(0);
    expect(ambient.time).toBeGreaterThan(before);
  });

  it("switches to the pointer when a mouse is attached", () => {
    const attach = mockPointer(false);
    const listen = vi.spyOn(window, "addEventListener");

    animatorWith().start(field, 320, 200, false);
    attach(true);

    expect(pointerListeners(listen)).toBe(1);
  });

  it("keeps the swell going across a restart", () => {
    mockPointer(false);
    const ambient = createAmbient();
    const animator = animatorWith(ambient);

    animator.start(field, 320, 200, false);
    runFrame(performance.now() + 16);
    const heading = [ambient.nx, ambient.ny];
    const time = ambient.time;
    animator.start(field, 480, 200, false);

    expect([ambient.nx, ambient.ny]).toEqual(heading);
    expect(ambient.time).toBe(time);
  });
});
