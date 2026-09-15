/*
 * Draft scaffolding.
 *
 * Creates `content/drafts/<slug>/` from `.ai/templates/`, ready for the first
 * pipeline stage. Refuses to overwrite an existing draft or a published post.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { AuthoringContext } from "./context.ts";
import { isKebabSlug } from "./draft.ts";
import { pathExists } from "./fs-utils.ts";

type ScaffoldOptions = {
  readonly context: AuthoringContext;
  readonly slug: string;
  /** Display title. Defaults to a title-cased slug. */
  readonly title?: string;
  /** ISO date `YYYY-MM-DD`. Defaults to today (local time). */
  readonly date?: string;
};

type ScaffoldResult = {
  readonly slug: string;
  readonly draftDir: string;
  readonly files: readonly string[];
};

const TITLE_TEMPLATE = "post.frontmatter.md";
const BRIEF_TEMPLATE = "brief.md";
const RESEARCH_TEMPLATE = "research.md";

const todayIso = (): string => {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const titleFromSlug = (slug: string): string =>
  slug
    .split("-")
    .filter((part) => part !== "")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const renderTemplate = (
  template: string,
  values: Readonly<Record<string, string>>,
): string =>
  template.replaceAll(/\{\{(\w+)\}\}/gu, (_match, key: string) => {
    return values[key] ?? "";
  });

const readTemplate = (
  context: AuthoringContext,
  name: string,
): Promise<string> => readFile(resolve(context.templatesDir, name), "utf8");

const scaffoldDraft = async (
  options: ScaffoldOptions,
): Promise<ScaffoldResult> => {
  const { context, slug } = options;

  if (!isKebabSlug(slug)) {
    throw new Error(
      `Invalid slug "${slug}". Use kebab-case: lowercase letters, digits, hyphens.`,
    );
  }

  const draftDir = resolve(context.draftsDir, slug);
  const publishedDir = resolve(context.rawDir, slug);

  const [draftExists, publishedExists] = await Promise.all([
    pathExists(draftDir),
    pathExists(publishedDir),
  ]);

  if (draftExists) {
    throw new Error(`Draft already exists: content/drafts/${slug}/`);
  }
  if (publishedExists) {
    throw new Error(`A published post already exists: content/raw/${slug}/`);
  }

  const titleFlag = options.title?.trim();
  const title =
    titleFlag === undefined || titleFlag === ""
      ? titleFromSlug(slug)
      : titleFlag;
  const dateFlag = options.date?.trim();
  const date =
    dateFlag === undefined || dateFlag === "" ? todayIso() : dateFlag;
  const values = { TITLE: title, SLUG: slug, DATE: date };

  const [postTemplate, briefTemplate, researchTemplate] = await Promise.all([
    readTemplate(context, TITLE_TEMPLATE),
    readTemplate(context, BRIEF_TEMPLATE),
    readTemplate(context, RESEARCH_TEMPLATE),
  ]);

  await Promise.all([
    mkdir(resolve(draftDir, "assets"), { recursive: true }),
    mkdir(resolve(draftDir, "snapshots"), { recursive: true }),
  ]);

  const files = [
    {
      path: resolve(draftDir, "post.md"),
      body: renderTemplate(postTemplate, values),
    },
    {
      path: resolve(draftDir, "brief.md"),
      body: renderTemplate(briefTemplate, values),
    },
    {
      path: resolve(draftDir, "research.md"),
      body: renderTemplate(researchTemplate, values),
    },
    { path: resolve(draftDir, "assets/.gitkeep"), body: "" },
    { path: resolve(draftDir, "snapshots/.gitkeep"), body: "" },
  ];

  await Promise.all(
    files.map((file) => writeFile(file.path, file.body, "utf8")),
  );

  return {
    slug,
    draftDir,
    files: files.map((file) => file.path),
  };
};

export { scaffoldDraft, titleFromSlug, todayIso };
export type { ScaffoldOptions, ScaffoldResult };
