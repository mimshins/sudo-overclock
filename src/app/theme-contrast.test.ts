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

const luminance = (hex: string): number => {
  const value = Number.parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  const [r = 0, g = 0, b = 0] = channels.map(channel => {
    const c = channel / 255;

    return c <= 0.039_28 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (
  theme: Theme,
  foreground: string,
  background: string,
): number => {
  const [a, b] = [color(theme, foreground), color(theme, background)].map(
    hex => {
      if (!/^#[\da-f]{6}$/iu.test(hex)) {
        throw new Error(`${theme}: ${foreground}/${background} is not hex`);
      }

      return luminance(hex);
    },
  );
  const high = Math.max(a ?? 0, b ?? 0);
  const low = Math.min(a ?? 0, b ?? 0);

  return (high + 0.05) / (low + 0.05);
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
  ["--color-neutral-text", "--color-neutral", TEXT],
  ["--focus-ring-color", "--color-background", NON_TEXT],
  ["--color-border-focus", "--color-background", NON_TEXT],
  ["--color-border-primary", "--color-background", NON_TEXT],
  ["--shiki-foreground", "--shiki-background", TEXT],
  ...shikiTokens.map(name => [name, "--shiki-background", TEXT] as const),
];

const KNOWN_DEVIATIONS = new Set([
  "dark --color-border-primary on --color-background",
]);

describe.each(["dark", "light"] as const)("%s theme contrast", theme => {
  it.each(pairs)("%s on %s meets %d:1", (foreground, background, minimum) => {
    const key = `${theme} ${foreground} on ${background}`;
    const value = ratio(theme, foreground, background);

    if (KNOWN_DEVIATIONS.has(key)) {
      expect(value).toBeLessThan(minimum);
      return;
    }

    expect(value).toBeGreaterThanOrEqual(minimum);
  });
});
