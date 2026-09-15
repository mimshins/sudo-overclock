/*
 * Draft publish.
 *
 * Runs preflight, strips draft-only frontmatter, and moves a ready draft into
 * `content/raw/<slug>/` with its assets. Refuses to overwrite an existing
 * published post. Never writes to `public/` or compiled content — that is the
 * compiler's job.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import matter from "gray-matter";

import type { AuthoringContext } from "./context.ts";
import { effectiveDraftSlug, parseDraft, stripDraftKeys } from "./draft.ts";
import { copyDirectoryContents, pathExists } from "./fs-utils.ts";
import { formatPreflightReport, preflightDraft } from "./preflight.ts";

type PublishOptions = {
  readonly context: AuthoringContext;
  readonly slug: string;
};

type PublishResult = {
  readonly slug: string;
  readonly postPath: string;
  readonly assetsCopied: number;
};

const publishDraft = async (
  options: PublishOptions,
): Promise<PublishResult> => {
  const { context, slug } = options;

  const report = await preflightDraft({ context, slug });
  if (!report.ok) {
    throw new Error(`Preflight failed.\n${formatPreflightReport(report)}`);
  }

  const draftDir = resolve(context.draftsDir, slug);
  const source = await readFile(resolve(draftDir, "post.md"), "utf8");
  const { data, content } = parseDraft(source);

  if (data.stage !== "ready") {
    throw new Error(
      `Draft stage is "${String(data.stage)}"; set it to "ready" before publishing.`,
    );
  }

  const effectiveSlug = effectiveDraftSlug(data, slug);
  const targetDir = resolve(context.rawDir, effectiveSlug);
  if (await pathExists(targetDir)) {
    throw new Error(
      `Refusing to overwrite existing content/raw/${effectiveSlug}/.`,
    );
  }

  await mkdir(targetDir, { recursive: true });

  const published = matter.stringify(
    content.replace(/^\n+/u, ""),
    stripDraftKeys(data),
  );
  const postPath = resolve(targetDir, `${effectiveSlug}.md`);
  await writeFile(postPath, published, "utf8");

  const assetsCopied = await copyDirectoryContents(
    resolve(draftDir, "assets"),
    targetDir,
  );

  return { slug, postPath, assetsCopied };
};

export { publishDraft };
export type { PublishOptions, PublishResult };
