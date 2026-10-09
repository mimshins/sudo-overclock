import type { DotField, Rgb } from "@repo/shared/ui/phosphor-field-core";

type FieldRender = "emit" | "ink";

const FALLBACK_BASE: Rgb = [140, 140, 140];
const FALLBACK_PHOSPHOR: Rgb = [0, 255, 156];

const RENDER_PROPERTY = "--phosphor-field-render";

const parseRgb = (value: string): Rgb | null => {
  const match = /(\d+),\s*(\d+),\s*(\d+)/u.exec(value);
  if (match === null) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

const resolveToken = (name: string, fallback: Rgb): Rgb => {
  if (typeof document === "undefined") return fallback;

  const probe = document.createElement("span");
  probe.style.color = `var(${name})`;
  probe.style.position = "fixed";
  probe.style.opacity = "0";
  probe.style.pointerEvents = "none";
  document.body.append(probe);

  const color = getComputedStyle(probe).color;
  probe.remove();

  return parseRgb(color) ?? fallback;
};

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

export {
  FALLBACK_BASE,
  FALLBACK_PHOSPHOR,
  fieldRender,
  inkFromLuminance,
  RENDER_PROPERTY,
  resolveToken,
};
export type { FieldRender };
