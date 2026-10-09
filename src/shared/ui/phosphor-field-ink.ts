import type { DotField, Rgb } from "./phosphor-field-core.ts";

type FieldRender = "emit" | "ink";

const RENDER_PROPERTY = "--phosphor-field-render";

const fieldRender = (): FieldRender =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(RENDER_PROPERTY)
    .trim() === "ink"
    ? "ink"
    : "emit";

const luminance = (r: number, g: number, b: number): number =>
  (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

const inkFromLuminance = (field: DotField, ink: Rgb, gain: number): void => {
  const { rgb, fill, alpha0 } = field;

  if (rgb === null || fill === null) {
    return;
  }

  const inkFill = `rgb(${ink[0]}, ${ink[1]}, ${ink[2]})`;

  for (let i = 0; i < alpha0.length; i += 1) {
    const r = rgb[i * 3] ?? 0;
    const g = rgb[i * 3 + 1] ?? 0;
    const b = rgb[i * 3 + 2] ?? 0;

    alpha0[i] = Math.min(1, luminance(r, g, b) * gain);
    rgb[i * 3] = ink[0];
    rgb[i * 3 + 1] = ink[1];
    rgb[i * 3 + 2] = ink[2];
    fill[i] = inkFill;
  }
};

export { fieldRender, inkFromLuminance, RENDER_PROPERTY };
export type { FieldRender };
