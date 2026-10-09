/*
 * Reading-page background generator.
 *
 * Renders the `PhosphorField` source for /reading procedurally: an open book
 * seen from above, its pages bowed toward the spine and filled with lines of
 * glowing text, one line on the right page in inverse video (the line being
 * read now) on a dark CRT ground. Nothing is licensed in: the output is fully
 * determined by the seed below. The generated `public/reading/bg.jpg` is
 * committed so builds never have to run this; regenerate with
 * `pnpm brand:backgrounds` after editing it.
 */

import { resolve } from "node:path";

import {
  createNoise,
  createRandom,
  paintCrt,
  smoothstep,
  type Random,
  type Shade,
} from "./raster.ts";

const projectRoot = resolve(import.meta.dirname, "../..");
const target = resolve(projectRoot, "public/reading/bg.jpg");

const SEED = 0xb00c;

const CENTER_X = 768;
const CENTER_Y = 520;
const TILT = 0.05;
const PAGE_WIDTH = 470;
const PAGE_HEIGHT = 620;
const INNER_MARGIN = 44;
const OUTER_MARGIN = 56;
const TOP_MARGIN = 64;
const BOTTOM_MARGIN = 70;
const LINE = 21;
const STROKE = 3.2;
const WORD_GAP = 9;
const STACK = 14;

const BLOCK = PAGE_WIDTH - INNER_MARGIN - OUTER_MARGIN;
const LINES = Math.floor((PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN) / LINE);
const READING_LINE = 9;

const PAPER = 0.07;
const TEXT = 0.42;
const EDGE = 0.3;
const HIGHLIGHT = 0.95;

type Word = readonly [start: number, end: number];

const random = createRandom(SEED);
const noise = createNoise(random);

/** Words for one page: ragged lines, paragraphs ending short, indents. */
const typeset = (rand: Random): Word[][] => {
  const lines: Word[][] = [];
  let untilBreak = 5 + Math.floor(rand() * 6);
  let indent = 0;

  for (let line = 0; line < LINES; line += 1) {
    const words: Word[] = [];
    const last = untilBreak === 0;
    const width = last ? BLOCK * (0.3 + rand() * 0.4) : BLOCK - rand() * 18;
    let cursor = indent;
    while (cursor < width) {
      const end = Math.min(width, cursor + 14 + rand() * 50);
      if (end - cursor > 8) words.push([cursor, end]);
      cursor = end + WORD_GAP;
    }
    lines.push(words);

    indent = last ? 24 : 0;
    untilBreak = last ? 5 + Math.floor(rand() * 6) : untilBreak - 1;
  }

  return lines;
};

const pages = [typeset(random), typeset(random)] as const;

const cos = Math.cos(TILT);
const sin = Math.sin(TILT);

/** Vertical lift of the page surface at `u` (0 spine, 1 outer edge). */
const bow = (u: number): number =>
  -16 * Math.sin(Math.PI * Math.min(1, u)) + 14 * (1 - Math.min(1, u)) ** 6;

const inkAt = (words: readonly Word[] | undefined, r: number): boolean =>
  words?.some(([start, end]) => r >= start && r <= end) ?? false;

/** Text, inverse-video highlight, and paper level at page coordinates. */
const pageLevel = (right: boolean, c: number, py: number): number => {
  const r = right ? c - INNER_MARGIN : PAGE_WIDTH - OUTER_MARGIN - c;
  const fromTop = py + PAGE_HEIGHT / 2 - TOP_MARGIN;
  const line = Math.floor(fromTop / LINE);
  const inLine = Math.abs(fromTop - line * LINE - LINE / 2);
  const words = line >= 0 && line < LINES ? pages[right ? 1 : 0][line] : [];
  const stroke = inLine <= STROKE && inkAt(words, r);

  const band = right && r >= -8 && r <= BLOCK + 8;
  if (band && line === READING_LINE && inLine <= LINE / 2 - 2) {
    return stroke ? 0.12 : HIGHLIGHT;
  }

  const halo = band
    ? 0.25 *
      Math.exp(-(((fromTop - (READING_LINE + 0.5) * LINE) / (LINE * 0.9)) ** 2))
    : 0;
  const tone = 0.85 + noise.fbm(c * 0.05, py * 0.05) * 0.3;

  return stroke ? TEXT * tone : PAPER * tone + halo;
};

const book = (x: number, y: number): number => {
  const dx = x - CENTER_X;
  const dy = y - CENTER_Y;
  const lx = dx * cos + dy * sin;
  const ly = -dx * sin + dy * cos;

  const c = Math.abs(lx);
  const u = c / PAGE_WIDTH;
  const py = ly - bow(u);
  const half = PAGE_HEIGHT / 2;

  if (u <= 1 && Math.abs(py) <= half) {
    const gutter = 0.25 + 0.75 * smoothstep(0, 0.1, u);
    const border =
      Math.min(PAGE_WIDTH - c, half - Math.abs(py)) <= 2 ? EDGE : 0;
    return Math.max(border, pageLevel(lx >= 0, c, py) * gutter);
  }

  const beyondSide = c - PAGE_WIDTH;
  const beyondFoot = py - half;
  const inStack =
    (beyondSide > 0 && beyondSide <= STACK && Math.abs(py) <= half + STACK) ||
    (beyondFoot > 0 && beyondFoot <= STACK && u <= 1 + STACK / PAGE_WIDTH);
  if (inStack) {
    const depth = Math.max(beyondSide, beyondFoot);
    return Math.floor(depth) % 3 === 0 ? 0.2 * (1 - depth / STACK) : 0.04;
  }

  const spill = Math.hypot(lx / (PAGE_WIDTH * 1.4), ly / (half * 1.6));
  return 0.035 * (1 - smoothstep(0.7, 1.3, spill));
};

const shade = (x: number, y: number): Shade => {
  const level = book(x, y);
  return { level, hot: smoothstep(0.8, 1, level) };
};

await paintCrt(target, random, noise, shade);

console.log("rendered public/reading/bg.jpg");
