/*
 * Open Graph theme — maps the dark-theme tokens in globals.css onto what the
 * share cards draw, so the cards never carry their own colours or glow recipe.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  emToPx,
  hexToRgb,
  readRootTokens,
  resolveToken,
  type Rgb,
} from "@repo/shared/lib/css-tokens";

type OgTheme = {
  readonly background: string;
  readonly foreground: string;
  readonly foregroundSecondary: string;
  readonly foregroundTertiary: string;
  readonly phosphor: string;
  readonly onPhosphor: string;
  readonly displayGlow: string;
  readonly displayStrike: string;
  readonly backgroundRgb: Rgb;
  readonly foregroundTertiaryRgb: Rgb;
  readonly phosphorRgb: Rgb;
};

const themeFromCss = (css: string): OgTheme => {
  const tokens = readRootTokens(css);
  const token = (name: string): string => resolveToken(tokens, name);

  return {
    background: token("--color-background"),
    foreground: token("--color-foreground"),
    foregroundSecondary: token("--color-foreground-secondary"),
    foregroundTertiary: token("--color-foreground-tertiary"),
    phosphor: token("--color-phosphor"),
    onPhosphor: token("--color-on-phosphor"),
    displayGlow: token("--display-glow"),
    displayStrike: token("--display-strike"),
    backgroundRgb: hexToRgb(token("--color-background")),
    foregroundTertiaryRgb: hexToRgb(token("--color-foreground-tertiary")),
    phosphorRgb: hexToRgb(token("--color-phosphor")),
  };
};

const strikeShadow = (theme: OgTheme, fontPx: number): string =>
  emToPx(theme.displayStrike, fontPx);

const loadOgTheme = (): OgTheme =>
  themeFromCss(
    readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8"),
  );

export type { OgTheme };
export { loadOgTheme, strikeShadow, themeFromCss };
