/*
 * CSS token reader — resolves custom properties from stylesheet text.
 *
 * Only blocks whose selector is exactly `:root` count, so theme overrides
 * (`[data-theme="light"]`) and `@theme inline` re-exports are skipped. Values
 * resolve every `var(--x)` recursively and fold `calc(<n><unit> * <n>)` into a
 * plain length, which is enough for build-time renderers that cannot evaluate
 * CSS themselves.
 */

type Rgb = readonly [number, number, number];

type CssTokens = ReadonlyMap<string, string>;

const COMMENT = /\/\*[\s\S]*?\*\//gu;
const ROOT_BLOCK = /(?:^|\n):root\s*\{([^}]*)\}/gu;
const DECLARATION = /(--[\w-]+)\s*:\s*([^;]+);/gu;
const VAR_REFERENCE = /var\((--[\w-]+)\)/gu;
const NUMBER = String.raw`-?\d*\.?\d+`;
const CALC_PRODUCT = new RegExp(
  String.raw`calc\(\s*(${NUMBER})([a-z%]*)\s*\*\s*(${NUMBER})([a-z%]*)\s*\)`,
  "gu",
);
const EM_LENGTH = new RegExp(String.raw`(${NUMBER})em\b`, "gu");
const MAX_DEPTH = 8;

const readRootTokens = (css: string): CssTokens => {
  const tokens = new Map<string, string>();

  for (const block of css.replaceAll(COMMENT, "").matchAll(ROOT_BLOCK)) {
    for (const declaration of (block[1] ?? "").matchAll(DECLARATION)) {
      const [, name, value] = declaration;
      if (name !== undefined && value !== undefined) {
        tokens.set(name, value.replaceAll(/\s+/gu, " ").trim());
      }
    }
  }

  return tokens;
};

const round = (value: number): number => Number(value.toFixed(4));

const foldCalc = (value: string): string => {
  const folded = value.replaceAll(
    CALC_PRODUCT,
    (
      match,
      left: string,
      leftUnit: string,
      right: string,
      rightUnit: string,
    ) =>
      leftUnit !== "" && rightUnit !== ""
        ? match
        : `${round(Number(left) * Number(right))}${leftUnit || rightUnit}`,
  );
  if (folded.includes("calc(")) {
    throw new Error(`css tokens: cannot fold "${value}"`);
  }
  return folded;
};

const substitute = (tokens: CssTokens, name: string, depth: number): string => {
  const value = tokens.get(name);
  if (value === undefined) {
    throw new Error(`css tokens: ${name} is not defined on :root`);
  }
  if (depth > MAX_DEPTH) {
    throw new Error(`css tokens: ${name} nests var() too deeply`);
  }
  return value.replaceAll(VAR_REFERENCE, (_, inner: string) =>
    substitute(tokens, inner, depth + 1),
  );
};

const resolveToken = (tokens: CssTokens, name: string): string =>
  foldCalc(substitute(tokens, name, 0));

const emToPx = (value: string, fontPx: number): string =>
  value.replaceAll(
    EM_LENGTH,
    (_, amount: string) => `${round(Number(amount) * fontPx)}px`,
  );

const hexToRgb = (hex: string): Rgb => {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu.exec(hex);
  if (match === null) throw new Error(`css tokens: ${hex} is not a #rrggbb`);
  return [
    Number.parseInt(match[1]!, 16),
    Number.parseInt(match[2]!, 16),
    Number.parseInt(match[3]!, 16),
  ];
};

export type { CssTokens, Rgb };
export { emToPx, hexToRgb, readRootTokens, resolveToken };
