/*
 * `pnpm author:preflight <slug>`
 *
 * Validates a draft; exits non-zero when there are blocking errors.
 */

import { resolve } from "node:path";

import { createAuthoringContext } from "../../src/modules/blog/infrastructure/authoring/context.ts";
import {
  formatPreflightReport,
  preflightDraft,
} from "../../src/modules/blog/infrastructure/authoring/preflight.ts";
import { parseArgs } from "./args.ts";

const USAGE = "usage: pnpm author:preflight <slug>";

const projectRoot = resolve(import.meta.dirname, "../..");
const { positional } = parseArgs(process.argv.slice(2));
const slug = positional[0];

if (slug === undefined) {
  console.error(USAGE);
  process.exit(1);
}

const context = createAuthoringContext(projectRoot);
const report = await preflightDraft({ context, slug });

console.log(formatPreflightReport(report));

if (!report.ok) {
  process.exit(1);
}
