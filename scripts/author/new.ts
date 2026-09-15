/*
 * `pnpm author:new <slug> [--title "<Title>"] [--date YYYY-MM-DD]`
 *
 * Scaffolds `content/drafts/<slug>/` from `.ai/templates/`.
 */

import { relative, resolve } from "node:path";

import { createAuthoringContext } from "../../src/modules/blog/infrastructure/authoring/context.ts";
import { scaffoldDraft } from "../../src/modules/blog/infrastructure/authoring/scaffold.ts";
import { parseArgs } from "./args.ts";

const USAGE =
  'usage: pnpm author:new <slug> [--title "<Title>"] [--date YYYY-MM-DD]';

const projectRoot = resolve(import.meta.dirname, "../..");
const { positional, flags } = parseArgs(process.argv.slice(2));
const slug = positional[0];

if (slug === undefined) {
  console.error(USAGE);
  process.exit(1);
}

const context = createAuthoringContext(projectRoot);

try {
  const result = await scaffoldDraft({
    context,
    slug,
    ...(flags.title === undefined ? {} : { title: flags.title }),
    ...(flags.date === undefined ? {} : { date: flags.date }),
  });
  console.log(`created ${relative(projectRoot, result.draftDir)}/`);
  console.log(
    "next: fill in post.md, then follow .ai/skills/post-authoring/pipeline.md",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
