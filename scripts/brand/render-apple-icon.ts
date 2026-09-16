/*
 * Brand asset rasterizer.
 *
 * Rasterizes the hand-authored favicon monogram (`src/app/icon.svg`) into the
 * 180x180 apple-touch icon. The generated `src/app/apple-icon.png` is committed
 * so builds never have to run this; regenerate with `pnpm brand:icons` after
 * editing the source SVG.
 */

import { resolve } from "node:path";

import sharp from "sharp";

const projectRoot = resolve(import.meta.dirname, "../..");

const source = resolve(projectRoot, "src/app/icon.svg");
const target = resolve(projectRoot, "src/app/apple-icon.png");

await sharp(source, { density: 600 }).resize(180, 180).png().toFile(target);

console.log("rendered src/app/apple-icon.png (180x180)");
