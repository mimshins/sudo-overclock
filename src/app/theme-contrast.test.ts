import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

type Theme = "dark" | "light";
type Tokens = ReadonlyMap<string, string>;

const css = readFileSync(
  resolve(import.meta.dirname, "globals.css"),
  "utf8",
).replaceAll(/\/\*[\s\S]*?\*\//gu, "");

const blockBodies = (selector: string): string[] => {
  const bodies: string[] = [];
  let from = 0;

  for (;;) {
    const at = css.indexOf(`${selector} {`, from);

    if (at === -1) {
      return bodies;
    }

    const open = css.indexOf("{", at);
    let depth = 1;
    let index = open + 1;

    while (depth > 0) {
      const char = css[index];

      depth += char === "{" ? 1 : char === "}" ? -1 : 0;
      index += 1;
    }

    bodies.push(css.slice(open + 1, index - 1));
    from = index;
  }
};

const declarations = (bodies: readonly string[]): Map<string, string> =>
  new Map(
    bodies.flatMap(body =>
      Array.from(body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/gu), match => [
        match[1] ?? "",
        (match[2] ?? "").trim(),
      ]),
    ),
  );

const base = declarations(blockBodies("\n:root"));
const tokens: Record<Theme, Tokens> = {
  dark: base,
  light: new Map([
    ...base,
    ...declarations(blockBodies(':root[data-theme="light"]')),
  ]),
};

const color = (
  theme: Theme,
  name: string,
  seen = new Set<string>(),
): string => {
  const value = tokens[theme].get(name);

  if (value === undefined || seen.has(name)) {
    throw new Error(`${theme}: cannot resolve ${name}`);
  }

  const reference = /^var\(\s*(--[\w-]+)\s*\)$/u.exec(value);

  return reference?.[1] === undefined
    ? value
    : color(theme, reference[1], new Set([...seen, name]));
};

const channels = (hex: string): number[] => {
  const value = Number.parseInt(hex.slice(1), 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const luminance = (hex: string): number => {
  const [r = 0, g = 0, b = 0] = channels(hex).map(channel => {
    const c = channel / 255;

    return c <= 0.039_28 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const hexLuminance = (theme: Theme, label: string, hex: string): number => {
  if (!/^#[\da-f]{6}$/iu.test(hex)) {
    throw new Error(`${theme}: ${label} is not hex`);
  }

  return luminance(hex);
};

const contrast = (a: number, b: number): number =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const ratio = (
  theme: Theme,
  foreground: string,
  background: string,
): number => {
  const label = `${foreground}/${background}`;

  return contrast(
    hexLuminance(theme, label, color(theme, foreground)),
    hexLuminance(theme, label, color(theme, background)),
  );
};

const percent = (theme: Theme, value: string): number => {
  const reference = /^var\(\s*(--[\w-]+)\s*\)$/u.exec(value);
  const resolved =
    reference?.[1] === undefined ? value : color(theme, reference[1]);

  return Number.parseFloat(resolved) / 100;
};

const composite = (top: string, alpha: number, bottom: string): string => {
  const below = channels(bottom);

  return `#${channels(top)
    .map((channel, index) =>
      Math.round(channel * alpha + (below[index] ?? 0) * (1 - alpha))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};

const glassRatio = (
  theme: Theme,
  foreground: string,
  glass: string,
  backdrop: string,
): number => {
  const mix =
    /^color-mix\(\s*in srgb,\s*var\(\s*(--[\w-]+)\s*\)\s+([^,]+?),\s*transparent\s*\)$/u.exec(
      color(theme, glass).replaceAll(/\s+/gu, " "),
    );

  if (mix?.[1] === undefined || mix[2] === undefined) {
    throw new Error(`${theme}: ${glass} is not a color-mix over transparent`);
  }

  const label = `${foreground}/${glass}`;
  const fill = composite(
    color(theme, mix[1]),
    percent(theme, mix[2]),
    color(theme, backdrop),
  );

  return contrast(
    hexLuminance(theme, label, color(theme, foreground)),
    hexLuminance(theme, label, fill),
  );
};

const TEXT = 4.5;
const NON_TEXT = 3;
const SURFACES = [
  "--color-background",
  "--color-background-elevated",
  "--color-background-raised",
];

const shikiTokens = [...base.keys()].filter(name =>
  name.startsWith("--shiki-token-"),
);

const pairs: ReadonlyArray<readonly [string, string, number]> = [
  ...[
    "--color-foreground",
    "--color-foreground-secondary",
    "--color-foreground-tertiary",
    "--color-phosphor",
    "--color-phosphor-text",
    "--color-positive-text",
    "--color-negative-text",
    "--color-warn-text",
    "--color-info-text",
  ].flatMap(text => SURFACES.map(surface => [text, surface, TEXT] as const)),
  ["--color-selection-foreground", "--color-selection-background", TEXT],
  ["--color-on-phosphor", "--color-phosphor", TEXT],
  ["--color-on-tint", "--color-background-tint", TEXT],
  ["--color-neutral-text", "--color-neutral", TEXT],
  ["--focus-ring-color", "--color-background", NON_TEXT],
  ["--color-border-focus", "--color-background", NON_TEXT],
  ["--color-border-primary", "--color-background", NON_TEXT],
  ["--shiki-foreground", "--shiki-background", TEXT],
  ...shikiTokens.map(name => [name, "--shiki-background", TEXT] as const),
];

describe.each(["dark", "light"] as const)("%s theme contrast", theme => {
  it.each(pairs)("%s on %s meets %d:1", (foreground, background, minimum) => {
    expect(ratio(theme, foreground, background)).toBeGreaterThanOrEqual(
      minimum,
    );
  });
});

const glassPairs: ReadonlyArray<readonly [string, string]> = [
  ...[
    "--color-foreground",
    "--color-foreground-secondary",
    "--color-phosphor",
  ].map(text => [text, "--color-glass-control"] as const),
  ["--color-on-tint", "--color-glass-control-hover"],
];
const BACKDROPS = ["--color-background", "--color-phosphor"];

describe.each(["dark", "light"] as const)(
  "%s theme frosted controls, unblurred over a field dot",
  theme => {
    it.each(
      glassPairs.flatMap(([text, glass]) =>
        BACKDROPS.map(backdrop => [text, glass, backdrop] as const),
      ),
    )("%s on %s over %s meets 4.5:1", (text, glass, backdrop) => {
      expect(glassRatio(theme, text, glass, backdrop)).toBeGreaterThanOrEqual(
        TEXT,
      );
    });
  },
);
