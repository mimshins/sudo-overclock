import { afterEach, describe, expect, it, vi } from "vitest";

import { requestImage, sampleImage } from "./phosphor-field-image.ts";

const decodeWith = (succeed: boolean) =>
  vi
    .spyOn(HTMLImageElement.prototype, "decode")
    .mockImplementation(() =>
      succeed ? Promise.resolve() : Promise.reject(new Error("broken")),
    );

const sized = (image: HTMLImageElement | null): void => {
  if (image === null) return;
  Object.defineProperty(image, "naturalWidth", { value: 1536 });
  Object.defineProperty(image, "naturalHeight", { value: 1024 });
};

const fakeContext = () => {
  const readback = vi.fn((_x: number, _y: number, w: number, h: number) => ({
    data: new Uint8ClampedArray(w * h * 4),
  }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a two-method stand-in for the 2D context happy-dom does not provide
    {
      drawImage: vi.fn(),
      getImageData: readback,
    } as unknown as RenderingContext,
  );
  return readback;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("requestImage", () => {
  it("fetches and decodes each URL once", async () => {
    const decode = decodeWith(true);

    const first = requestImage("/once.jpg");
    const second = requestImage("/once.jpg");
    await first.ready;

    expect(second).toBe(first);
    expect(decode).toHaveBeenCalledOnce();
    expect(first.image()).not.toBeNull();
  });

  it("forgets a failed image so the next mount retries", async () => {
    decodeWith(false);

    const failed = requestImage("/broken.jpg");

    await expect(failed.ready).resolves.toBeNull();
    expect(failed.image()).toBeNull();
    expect(requestImage("/broken.jpg")).not.toBe(failed);
  });
});

describe("sampleImage", () => {
  it("returns nothing until the image has decoded", () => {
    decodeWith(true);
    const readback = fakeContext();

    expect(sampleImage(requestImage("/pending.jpg"), 400, 300, 4)).toBeNull();
    expect(readback).not.toHaveBeenCalled();
  });

  it("covers the field with one sample per grid cell", async () => {
    decodeWith(true);
    fakeContext();
    const entry = requestImage("/grid.jpg");
    sized(await entry.ready);

    const source = sampleImage(entry, 401, 300, 4);

    expect(source?.width).toBe(101);
    expect(source?.height).toBe(75);
    expect(source?.data.length).toBe(101 * 75 * 4);
  });

  it("reuses samples per grid size and evicts the oldest", async () => {
    decodeWith(true);
    const readback = fakeContext();
    const entry = requestImage("/memo.jpg");
    sized(await entry.ready);

    sampleImage(entry, 400, 300, 4);
    sampleImage(entry, 400, 300, 4);
    expect(readback).toHaveBeenCalledOnce();

    sampleImage(entry, 480, 300, 4);
    sampleImage(entry, 560, 300, 4);
    sampleImage(entry, 400, 300, 4);
    expect(readback).toHaveBeenCalledTimes(4);
  });
});
