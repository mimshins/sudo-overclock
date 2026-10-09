import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hover = vi.hoisted(() => ({
  created: vi.fn<() => void>(),
  start:
    vi.fn<
      (field: unknown, width: number, height: number, reveal: boolean) => void
    >(),
  stop: vi.fn<() => void>(),
}));

vi.mock("./phosphor-field-hover.ts", () => ({
  HoverAnimator: vi.fn(function HoverAnimator() {
    hover.created();
    return { start: hover.start, stop: hover.stop };
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

const sizeContainer = (
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): void => {
  const parent = canvas.parentElement!;
  Object.defineProperty(parent, "clientWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(parent, "clientHeight", {
    configurable: true,
    value: height,
  });
};

const captureResize = (): (() => void) => {
  const callbacks: (() => void)[] = [];

  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        callbacks.push(callback);
      }
      observe = noop;
      disconnect = noop;
    },
  );

  return () => {
    for (const callback of callbacks) callback();
  };
};

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a no-op proxy stands in for the 2D context happy-dom does not provide
    fakeContext as CanvasRenderingContext2D,
  );
});

afterEach(() => {
  vi.useRealTimers();
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

const settle = (): void => {
  vi.advanceTimersByTime(1000);
};

describe("PhosphorSession resize", () => {
  it("pops dots in on the first paint only", () => {
    mockReducedMotion(false);
    const canvas = mountCanvas();
    sizeContainer(canvas, 320, 200);
    const session = new PhosphorSession(canvas, null, true);

    session.start();
    session.refreshColors();

    expect(hover.start.mock.calls.map(call => call[3])).toEqual([true, false]);
    session.stop();
  });

  it("keeps the field when the container only gets shorter", () => {
    vi.useFakeTimers();
    mockReducedMotion(false);
    const resize = captureResize();
    const canvas = mountCanvas();
    sizeContainer(canvas, 320, 600);
    const session = new PhosphorSession(canvas, null, true);
    session.start();

    sizeContainer(canvas, 320, 520);
    resize();
    settle();

    expect(hover.start).toHaveBeenCalledOnce();
    session.stop();
  });

  it("rebuilds once, without the reveal, after a burst of resizes", () => {
    vi.useFakeTimers();
    mockReducedMotion(false);
    const resize = captureResize();
    const canvas = mountCanvas();
    sizeContainer(canvas, 320, 600);
    const session = new PhosphorSession(canvas, null, true);
    session.start();

    for (const width of [360, 400, 480]) {
      sizeContainer(canvas, width, 600);
      resize();
    }
    settle();

    expect(hover.start).toHaveBeenCalledTimes(2);
    expect(hover.start).toHaveBeenLastCalledWith(
      expect.anything(),
      480,
      600,
      false,
    );
    session.stop();
  });
});
