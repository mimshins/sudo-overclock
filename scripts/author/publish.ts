/*
 * `pnpm author:publish <slug> [--compile]`
 *
 * Moves a ready draft into `content/raw/<slug>/`. Pass `--compile` to also run
 * the content compiler afterwards.
 */

import { resolve } from "node:path";

import { createAuthoringContext } from "../../src/modules/blog/infrastructure/authoring/context.ts";
import { publishDraft } from "../../src/modules/blog/infrastructure/authoring/publish.ts";
import { compileAll } from "../../src/modules/blog/infrastructure/compiler/compile.ts";
import { parseArgs } from "./args.ts";

const USAGE = "usage: pnpm author:publish <slug> [--compile]";

const projectRoot = resolve(import.meta.dirname, "../..");
const { positional, flags } = parseArgs(process.argv.slice(2));
const slug = positional[0];

if (slug === undefined) {
  console.error(USAGE);
  process.exit(1);
}

const context = createAuthoringContext(projectRoot);

try {
  const result = await publishDraft({ context, slug });
  console.log(
    `published content/raw/${slug}/ (${result.assetsCopied} asset(s) copied)`,
  );

  if (flags.compile === "true") {
    const posts = await compileAll({
      rawDir: context.rawDir,
      compiledDir: context.compiledDir,
      publicDir: context.publicDir,
    });
    console.log(`compiled ${posts.length} post(s)`);
  } else {
    console.log("next: pnpm compile && pnpm dev");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
