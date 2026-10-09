import {
  emToPx,
  hexToRgb,
  readRootTokens,
  resolveToken,
} from "@repo/shared/lib/css-tokens";
import { describe, expect, it } from "vitest";

const CSS = `
:root {
  /* --color-surface-base: #ffffff; */
  --color-surface-base: #0a0a0a;
  --glow-color: rgb(0 255 156 / 0.4);
  --glow-strength: 0.55;
  --strike-offset: 0.06em;
}
:root[data-theme="light"] {
  --color-surface-base: #f4f1e6;
}
:root {
  --color-background: var(--color-surface-base);
  --strike: var(--strike-offset) 0 0 currentColor;
  --glow:
    0 0 calc(4px * var(--glow-strength)) var(--glow-color),
    0 0 calc(10px * var(--glow-strength)) var(--glow-color);
}
@theme inline {
  --color-background: var(--color-background);
}
`;

describe("resolveToken", () => {
  const tokens = readRootTokens(CSS);

  it("reads dark :root tokens and skips light overrides, @theme, and comments", () => {
    expect(resolveToken(tokens, "--color-background")).toBe("#0a0a0a");
  });

  it("substitutes every var() inside a compound value and folds calc()", () => {
    expect(resolveToken(tokens, "--glow")).toBe(
      "0 0 2.2px rgb(0 255 156 / 0.4), 0 0 5.5px rgb(0 255 156 / 0.4)",
    );
  });

  it("fails loudly on a missing token", () => {
    expect(() => resolveToken(tokens, "--nope")).toThrow(/--nope/u);
  });

  it("refuses calc() it cannot fold", () => {
    const odd = readRootTokens(":root { --x: calc(1px + 2px); }");

    expect(() => resolveToken(odd, "--x")).toThrow(/cannot fold/u);
  });
});

describe("emToPx", () => {
  it("converts em lengths at the given font size", () => {
    expect(emToPx(resolveToken(readRootTokens(CSS), "--strike"), 80)).toBe(
      "4.8px 0 0 currentColor",
    );
  });
});

describe("hexToRgb", () => {
  it("parses #rrggbb and rejects anything else", () => {
    expect(hexToRgb("#00ff9c")).toEqual([0, 255, 156]);
    expect(() => hexToRgb("rgb(0 0 0)")).toThrow();
  });
});
