/*
 * Draft preflight.
 *
 * Validates a draft before it is published: frontmatter, body conventions,
 * relative image existence, and slug uniqueness against published posts and
 * other drafts. Errors block publish; warnings do not.
 */

import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

import type { AuthoringContext } from "./context.ts";
import {
  effectiveDraftSlug,
  findImages,
  isKebabSlug,
  parseDraft,
  validateBody,
  validateFrontmatter,
  type DraftIssue,
} from "./draft.ts";
import { listDirectoryNames, pathExists } from "./fs-utils.ts";

type PreflightOptions = {
  readonly context: AuthoringContext;
  readonly slug: string;
};

type PreflightReport = {
  readonly slug: string;
  readonly ok: boolean;
  readonly issues: readonly DraftIssue[];
};

const EXTERNAL_SRC_PATTERN = /^(?:https?:)?\/\/|^data:|^#|^\/|^mailto:/u;

const buildReport = (
  slug: string,
  issues: readonly DraftIssue[],
): PreflightReport => ({
  slug,
  ok: issues.every((issue) => issue.level !== "error"),
  issues,
});

const preflightDraft = async (
  options: PreflightOptions,
): Promise<PreflightReport> => {
  const { context, slug } = options;

  if (!isKebabSlug(slug)) {
    return buildReport(slug, [
      {
        level: "error",
        message: `Invalid slug "${slug}". Use kebab-case: lowercase letters, digits, hyphens.`,
      },
    ]);
  }

  const postPath = resolve(context.draftsDir, slug, "post.md");
  if (!(await pathExists(postPath))) {
    return buildReport(slug, [
      {
        level: "error",
        message: `No draft at content/drafts/${slug}/post.md. Run \`pnpm author:new ${slug}\` first.`,
      },
    ]);
  }

  const source = await readFile(postPath, "utf8");
  const { data, content } = parseDraft(source);
  const effectiveSlug = effectiveDraftSlug(data, slug);

  const issues: DraftIssue[] = [
    ...validateFrontmatter(data),
    ...validateBody(content),
  ];

  const imageIssues = await Promise.all(
    findImages(content)
      .filter((image) => !EXTERNAL_SRC_PATTERN.test(image.src))
      .map(async (image): Promise<DraftIssue | null> => {
        const beside = resolve(context.draftsDir, slug, image.src);
        const inAssets = resolve(
          context.draftsDir,
          slug,
          "assets",
          basename(image.src),
        );
        const [besideExists, inAssetsExists] = await Promise.all([
          pathExists(beside),
          pathExists(inAssets),
        ]);
        if (besideExists || inAssetsExists) return null;
        return {
          level: "error",
          message: `Image not found: ${image.src} (looked beside post.md and in assets/).`,
        };
      }),
  );

  issues.push(
    ...imageIssues.filter((issue): issue is DraftIssue => issue !== null),
  );

  if (await pathExists(resolve(context.rawDir, effectiveSlug))) {
    issues.push({
      level: "error",
      message: `A published post already exists at content/raw/${effectiveSlug}/.`,
    });
  }

  const otherDirs = await listDirectoryNames(context.draftsDir);
  const collisionIssues = await Promise.all(
    otherDirs
      .filter((other) => other !== slug)
      .map(async (other): Promise<DraftIssue | null> => {
        const otherPost = resolve(context.draftsDir, other, "post.md");
        if (!(await pathExists(otherPost))) return null;
        const otherSource = await readFile(otherPost, "utf8");
        const { data: otherData } = parseDraft(otherSource);
        if (effectiveDraftSlug(otherData, other) !== effectiveSlug) return null;
        return {
          level: "error",
          message: `Draft "${other}" already publishes under slug "${effectiveSlug}".`,
        };
      }),
  );

  issues.push(
    ...collisionIssues.filter((issue): issue is DraftIssue => issue !== null),
  );

  return buildReport(slug, issues);
};

const formatPreflightReport = (report: PreflightReport): string => {
  if (report.issues.length === 0) {
    return `preflight ${report.slug}: OK`;
  }

  const errors = report.issues.filter(
    (issue) => issue.level === "error",
  ).length;
  const warnings = report.issues.length - errors;
  const header = `preflight ${report.slug}: ${
    report.ok ? "OK" : "FAILED"
  } (${errors} error(s), ${warnings} warning(s))`;

  const lines = report.issues.map(
    (issue) =>
      `  ${issue.level === "error" ? "error" : "warn "} ${issue.message}`,
  );

  return [header, ...lines].join("\n");
};

export { formatPreflightReport, preflightDraft };
export type { PreflightOptions, PreflightReport };
