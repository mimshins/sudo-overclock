import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hover = vi.hoisted(() => ({
  created: vi.fn<() => void>(),
  stop: vi.fn<() => void>(),
}));

vi.mock("./phosphor-field-hover.ts", () => ({
  HoverAnimator: vi.fn(function HoverAnimator() {
    hover.created();
    return { start: vi.fn(), stop: hover.stop };
  }),
}));

const { PhosphorSession } = await import("./phosphor-field-session.ts");

type Listener = (event: Pick<MediaQueryListEvent, "matches">) => void;

const mockReducedMotion = (reduced: boolean) => {
  const listeners = new Set<Listener>();

  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: reduced,
      addEventListener: (_: string, listener: Listener) =>
        listeners.add(listener),
      removeEventListener: (_: string, listener: Listener) =>
        listeners.delete(listener),
    })),
  );

  return (matches: boolean) => {
    for (const listener of listeners) {
      listener({ matches });
    }
  };
};

const noop = (): void => undefined;
const fakeContext = new Proxy(
  {},
  { get: (_, key) => (key === "canvas" ? undefined : noop) },
);

const mountCanvas = (): HTMLCanvasElement => {
  const parent = document.createElement("div");
  const canvas = document.createElement("canvas");

  parent.append(canvas);
  document.body.append(parent);

  return canvas;
};

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a no-op proxy stands in for the 2D context happy-dom does not provide
    fakeContext as CanvasRenderingContext2D,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  document.body.replaceChildren();
});

describe("PhosphorSession motion", () => {
  it("lights dots under the pointer when motion is allowed", () => {
    mockReducedMotion(false);
    new PhosphorSession(mountCanvas(), null, true).start();

    expect(hover.created).toHaveBeenCalledOnce();
  });

  it("renders statically under reduced motion, even with hover on", () => {
    mockReducedMotion(true);
    new PhosphorSession(mountCanvas(), null, true).start();

    expect(hover.created).not.toHaveBeenCalled();
  });

  it("drops the hover loop when reduced motion turns on", () => {
    const change = mockReducedMotion(false);
    const session = new PhosphorSession(mountCanvas(), null, true);

    session.start();
    change(true);

    expect(hover.stop).toHaveBeenCalled();
    session.stop();
  });
});
