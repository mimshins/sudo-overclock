/*
 * PhosphorField image helpers — decoding support for the pointillist mode.
 */

/** Start decoding `src`; `onReady(true)` after load, `onReady(false)` on error. */
const loadImage = (
  src: string,
  onReady: (success: boolean) => void,
): HTMLImageElement => {
  const image = new Image();
  image.decoding = "async";
  image.addEventListener("load", () => {
    onReady(true);
  });
  image.addEventListener("error", () => {
    onReady(false);
  });
  image.src = src;
  return image;
};

/** Draw the image cover-fit onto a grid canvas and return its RGBA pixels. */
const sampleImage = (
  image: HTMLImageElement,
  width: number,
  height: number,
): Uint8ClampedArray | null => {
  if (width <= 0 || height <= 0 || image.naturalWidth === 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (context === null) return null;

  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  );

  return context.getImageData(0, 0, width, height).data;
};

export { loadImage, sampleImage };
