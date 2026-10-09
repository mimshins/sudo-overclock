import { describe, expect, it } from "vitest";

import { loadOgTheme, strikeShadow, themeFromCss } from "./og-theme.ts";

const CSS = `
:root {
  --color-surface-base: #0a0a0a;
  --color-neutral-50: #f6f6f6;
  --color-neutral-300: #cacaca;
  --color-neutral-400: #a4a4a4;
  --color-neutral-900: #0a0a0a;
  --color-phosphor-500: #00ff9c;
  --color-phosphor-glow: rgb(0 255 156 / 0.4);
  --color-phosphor-shadow: rgb(0 255 156 / 0.18);
  --phosphor-glow-strength: 0.55;
  --display-strike-offset: 0.06em;
}
:root {
  --color-background: var(--color-surface-base);
  --color-foreground: var(--color-neutral-50);
  --color-foreground-secondary: var(--color-neutral-300);
  --color-foreground-tertiary: var(--color-neutral-400);
  --color-phosphor: var(--color-phosphor-500);
  --color-on-phosphor: var(--color-neutral-900);
  --display-strike: var(--display-strike-offset) 0 0 currentColor;
  --display-glow:
    0 0 calc(4px * var(--phosphor-glow-strength)) var(--color-phosphor-glow),
    0 0 calc(10px * var(--phosphor-glow-strength)) var(--color-phosphor-shadow);
}
`;

describe("themeFromCss", () => {
  it("maps the dark tokens the cards draw", () => {
    const theme = themeFromCss(CSS);

    expect(theme.background).toBe("#0a0a0a");
    expect(theme.backgroundRgb).toEqual([10, 10, 10]);
    expect(theme.phosphorRgb).toEqual([0, 255, 156]);
    expect(theme.foregroundTertiary).toBe("#a4a4a4");
    expect(theme.displayGlow).toBe(
      "0 0 2.2px rgb(0 255 156 / 0.4), 0 0 5.5px rgb(0 255 156 / 0.18)",
    );
    expect(theme.displayStrike).toBe("0.06em 0 0 currentColor");
    expect(strikeShadow(theme, 80)).toBe("4.8px 0 0 currentColor");
  });

  it("fails loudly when a token is missing", () => {
    expect(() =>
      themeFromCss(":root { --color-background: #000000; }"),
    ).toThrow(/--color-foreground/u);
  });

  it("reads every token it needs from the real globals.css", () => {
    expect(() => loadOgTheme()).not.toThrow();
  });
});
