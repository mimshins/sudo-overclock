/*
 * Build-time content compiler entrypoint.
 *
 * Run via `pnpm compile`. Compiles `modules/blog/content/raw/**` into
 * `modules/blog/content/compiled/index.ts` and copies referenced image assets
 * into `public/posts/<slug>/`, reusing encoded images from the persistent store
 * in `node_modules/.cache/sudo-overclock/images/`.
 */

import { resolve } from "node:path";

import { compileAll } from "../src/modules/blog/infrastructure/compiler/compile.ts";

const projectRoot = resolve(import.meta.dirname, "..");

const options = {
  rawDir: resolve(projectRoot, "src/modules/blog/content/raw"),
  compiledDir: resolve(projectRoot, "src/modules/blog/content/compiled"),
  publicDir: resolve(projectRoot, "public"),
  imageCacheDir: resolve(
    projectRoot,
    "node_modules/.cache/sudo-overclock/images",
  ),
};

const compiledPosts = await compileAll(options);

console.log(`compiled ${compiledPosts.length} post(s)`);
