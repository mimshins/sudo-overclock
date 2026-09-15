/*
 * Draft frontmatter parsing and pure validation.
 *
 * Everything here is filesystem-free so it can be unit-tested directly.
 * Filesystem checks live in `preflight.ts` / `publish.ts`.
 */

import matter from "gray-matter";

import { slugify } from "../compiler/slug.ts";

const DRAFT_STAGES = [
  "seed",
  "brief",
  "research",
  "outline",
  "draft",
  "review",
  "resolve",
  "preflight",
  "ready",
] as const;

type DraftStage = (typeof DRAFT_STAGES)[number];

/** Frontmatter keys that describe the drafting process, not the post. */
const DRAFT_ONLY_KEYS = ["stage"] as const;

const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 160;

const KEBAB_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

type DraftFrontmatter = {
  readonly title?: unknown;
  readonly date?: unknown;
  readonly description?: unknown;
  readonly tags?: unknown;
  readonly author?: unknown;
  readonly slug?: unknown;
  readonly stage?: unknown;
};

type ParsedDraft = {
  readonly data: DraftFrontmatter;
  readonly content: string;
};

type IssueLevel = "error" | "warning";

type DraftIssue = {
  readonly level: IssueLevel;
  readonly message: string;
};

const parseDraft = (source: string): ParsedDraft => {
  const { data, content } = matter(source);
  return { data, content };
};

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const normalizeTags = (value: unknown): readonly string[] => {
  if (value === undefined || value === null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .filter((tag): tag is string => typeof tag === "string")
    .map(tag => tag.trim())
    .filter(tag => tag !== "");
};

const isKebabSlug = (value: string): boolean => KEBAB_SLUG_PATTERN.test(value);

const isIsoDate = (value: string): boolean => ISO_DATE_PATTERN.test(value);

const isDraftStage = (value: unknown): value is DraftStage =>
  typeof value === "string" &&
  (DRAFT_STAGES as readonly string[]).includes(value);

/** Remove process-only keys before the draft becomes a published post. */
const stripDraftKeys = (data: DraftFrontmatter): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(data).filter(
      ([key]) => !(DRAFT_ONLY_KEYS as readonly string[]).includes(key),
    ),
  );

/**
 * The slug a draft will publish under: its frontmatter `slug` override
 * (slugified) when present, otherwise the draft directory name.
 */
const effectiveDraftSlug = (
  data: DraftFrontmatter,
  dirName: string,
): string => {
  const override = asString(data.slug);
  return override !== undefined && override.trim() !== ""
    ? slugify(override)
    : dirName;
};

const validateFrontmatter = (data: DraftFrontmatter): readonly DraftIssue[] => {
  const issues: DraftIssue[] = [];

  if ((asString(data.title)?.trim() ?? "") === "") {
    issues.push({ level: "error", message: "Missing required `title`." });
  }

  const date = asString(data.date)?.trim() ?? "";
  if (date === "") {
    issues.push({ level: "error", message: "Missing required `date`." });
  } else if (!isIsoDate(date)) {
    issues.push({
      level: "error",
      message: "`date` must be ISO `YYYY-MM-DD`.",
    });
  }

  const description = asString(data.description)?.trim() ?? "";
  if (description === "") {
    issues.push({ level: "error", message: "Missing required `description`." });
  } else if (
    description.length < DESCRIPTION_MIN ||
    description.length > DESCRIPTION_MAX
  ) {
    issues.push({
      level: "warning",
      message: `\`description\` is ${description.length} chars; aim for ${DESCRIPTION_MIN}–${DESCRIPTION_MAX}.`,
    });
  }

  if (normalizeTags(data.tags).length === 0) {
    issues.push({ level: "error", message: "Missing required `tags`." });
  }

  if (!isDraftStage(data.stage)) {
    issues.push({
      level: "error",
      message: `\`stage\` must be one of: ${DRAFT_STAGES.join(", ")}.`,
    });
  } else if (data.stage !== "ready") {
    issues.push({
      level: "warning",
      message: `\`stage\` is "${data.stage}"; run preflight when it is "ready".`,
    });
  }

  return issues;
};

type DraftImage = {
  readonly alt: string;
  readonly src: string;
};

const findImages = (markdown: string): readonly DraftImage[] => {
  const pattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gu;
  const images: DraftImage[] = [];
  for (const match of markdown.matchAll(pattern)) {
    images.push({ alt: match[1] ?? "", src: match[2] ?? "" });
  }
  return images;
};

const findCodeFenceLanguages = (markdown: string): readonly string[] => {
  const pattern = /^(`{3,}|~{3,})\s*(.*)$/u;
  const languages: string[] = [];
  let openMarker: string | null = null;

  for (const line of markdown.split("\n")) {
    const match = pattern.exec(line);
    if (match === null) continue;

    const marker = (match[1] ?? "`").charAt(0);
    const info = (match[2] ?? "").trim();

    if (openMarker === null) {
      openMarker = marker;
      languages.push(info.split(/\s+/u)[0] ?? "");
    } else if (marker === openMarker) {
      openMarker = null;
    }
  }

  return languages;
};

const validateBody = (content: string): readonly DraftIssue[] => {
  const issues: DraftIssue[] = [];

  if (content.trimStart().startsWith("# ")) {
    issues.push({
      level: "warning",
      message:
        "Body starts with an h1; the compiler strips it. Start the body at h2.",
    });
  }

  for (const language of findCodeFenceLanguages(content)) {
    if (language === "") {
      issues.push({
        level: "warning",
        message: "A fenced code block has no language.",
      });
    }
  }

  for (const image of findImages(content)) {
    if (image.alt.trim() === "") {
      issues.push({
        level: "warning",
        message: `Image "${image.src}" has no alt text.`,
      });
    }
  }

  return issues;
};

export {
  DRAFT_STAGES,
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  effectiveDraftSlug,
  findCodeFenceLanguages,
  findImages,
  isDraftStage,
  isIsoDate,
  isKebabSlug,
  normalizeTags,
  parseDraft,
  stripDraftKeys,
  validateBody,
  validateFrontmatter,
};
export type {
  DraftFrontmatter,
  DraftIssue,
  DraftStage,
  IssueLevel,
  ParsedDraft,
};
