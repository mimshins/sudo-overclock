import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, it } from "node:test";

import type { AuthoringContext } from "./context.ts";
import {
  effectiveDraftSlug,
  isKebabSlug,
  parseDraft,
  stripDraftKeys,
  validateBody,
  validateFrontmatter,
} from "./draft.ts";
import { preflightDraft } from "./preflight.ts";
import { publishDraft } from "./publish.ts";
import { scaffoldDraft, titleFromSlug } from "./scaffold.ts";

const makeContext = async (): Promise<AuthoringContext> => {
  const root = await mkdtemp(join(tmpdir(), "soc-authoring-"));
  const draftsDir = join(root, "drafts");
  const rawDir = join(root, "raw");
  await mkdir(draftsDir, { recursive: true });
  await mkdir(rawDir, { recursive: true });

  return {
    projectRoot: root,
    draftsDir,
    rawDir,
    compiledDir: join(root, "compiled"),
    publicDir: join(root, "public"),
    templatesDir: resolve(process.cwd(), ".ai/templates"),
  };
};

const READY_POST = [
  "---",
  'title: "Test Post"',
  'date: "2026-01-02"',
  'description: "A sufficiently long description for the preflight length check to pass cleanly."',
  "tags:",
  "  - testing",
  "stage: ready",
  "---",
  "",
  "## Intro",
  "",
  "Body text.",
  "",
  "```ts",
  "const x = 1;",
  "```",
  "",
  "![diagram](./diagram.png)",
  "",
].join("\n");

describe("slug and template helpers", () => {
  it("accepts kebab-case slugs", () => {
    assert.equal(isKebabSlug("my-post-2"), true);
  });

  it("rejects non-kebab slugs", () => {
    assert.equal(isKebabSlug("My_Post"), false);
    assert.equal(isKebabSlug("trailing-"), false);
    assert.equal(isKebabSlug(""), false);
  });

  it("title-cases a slug", () => {
    assert.equal(
      titleFromSlug("hello-overclock-world"),
      "Hello Overclock World",
    );
  });
});

describe("frontmatter validation", () => {
  it("reports missing required fields", () => {
    const issues = validateFrontmatter({ stage: "ready" });
    const messages = issues.map((issue) => issue.message).join("\n");
    assert.match(messages, /title/u);
    assert.match(messages, /`date`/u);
    assert.match(messages, /`description`/u);
    assert.match(messages, /`tags`/u);
    assert.equal(
      issues.every((issue) => issue.level === "error"),
      true,
    );
  });

  it("reports a non-ISO date as an error", () => {
    const issues = validateFrontmatter({
      title: "T",
      date: "02/01/2026",
      description: "d",
      tags: ["a"],
      stage: "ready",
    });
    assert.equal(
      issues.some(
        (issue) => issue.message.includes("ISO") && issue.level === "error",
      ),
      true,
    );
  });

  it("warns when the stage is not ready", () => {
    const issues = validateFrontmatter({
      title: "T",
      date: "2026-01-02",
      description: "x".repeat(80),
      tags: ["a"],
      stage: "draft",
    });
    assert.equal(issues.length, 1);
    assert.equal(issues[0]?.level, "warning");
  });

  it("passes a complete, ready frontmatter", () => {
    const issues = validateFrontmatter({
      title: "T",
      date: "2026-01-02",
      description: "x".repeat(80),
      tags: ["a"],
      stage: "ready",
    });
    assert.deepEqual(issues, []);
  });
});

describe("body validation", () => {
  it("warns on a leading h1", () => {
    const issues = validateBody("# Title\n\nBody.");
    assert.equal(
      issues.some((issue) => issue.message.includes("h1")),
      true,
    );
  });

  it("warns on a fence without a language", () => {
    const issues = validateBody("## H\n\n```\ncode\n```");
    assert.equal(
      issues.some((issue) => issue.message.includes("no language")),
      true,
    );
  });

  it("warns on an image without alt text", () => {
    const issues = validateBody("## H\n\n![](./x.png)");
    assert.equal(
      issues.some((issue) => issue.message.includes("alt")),
      true,
    );
  });

  it("stays quiet on a clean body", () => {
    assert.deepEqual(
      validateBody("## H\n\n```ts\ncode\n```\n\n![alt](./a.png)"),
      [],
    );
  });
});

describe("parse and strip", () => {
  it("removes draft-only keys", () => {
    const { data } = parseDraft("---\nstage: ready\ntitle: T\n---\n\nbody");
    assert.deepEqual(stripDraftKeys(data), { title: "T" });
  });

  it("derives the effective slug from an override", () => {
    assert.equal(
      effectiveDraftSlug({ slug: "Other Slug" }, "dir-name"),
      "other-slug",
    );
    assert.equal(effectiveDraftSlug({}, "dir-name"), "dir-name");
  });
});

describe("scaffold, preflight, and publish", () => {
  it("scaffolds a draft workspace from templates", async () => {
    const context = await makeContext();
    const result = await scaffoldDraft({
      context,
      slug: "fresh-post",
      title: "Fresh Post",
      date: "2026-03-01",
    });

    const post = await readFile(join(result.draftDir, "post.md"), "utf8");
    assert.match(post, /title: "Fresh Post"/u);
    assert.match(post, /stage: seed/u);

    const report = await preflightDraft({ context, slug: "fresh-post" });
    assert.equal(report.ok, false);
  });

  it("passes preflight, then publishes and strips stage", async () => {
    const context = await makeContext();
    await scaffoldDraft({ context, slug: "ready-post", date: "2026-01-02" });

    const draftDir = join(context.draftsDir, "ready-post");
    await writeFile(join(draftDir, "post.md"), READY_POST, "utf8");
    await writeFile(join(draftDir, "assets", "diagram.png"), "png", "utf8");

    const report = await preflightDraft({ context, slug: "ready-post" });
    assert.equal(report.ok, true, JSON.stringify(report.issues));

    const result = await publishDraft({ context, slug: "ready-post" });
    assert.equal(result.assetsCopied, 1);

    const published = await readFile(
      join(context.rawDir, "ready-post", "ready-post.md"),
      "utf8",
    );
    assert.doesNotMatch(published, /stage:/u);
    assert.match(published, /title: Test Post/u);

    const asset = await readFile(
      join(context.rawDir, "ready-post", "diagram.png"),
      "utf8",
    );
    assert.equal(asset, "png");
  });

  it("refuses to publish twice", async () => {
    const context = await makeContext();
    await scaffoldDraft({ context, slug: "dup-post", date: "2026-01-02" });
    const draftDir = join(context.draftsDir, "dup-post");
    await writeFile(join(draftDir, "post.md"), READY_POST, "utf8");
    await writeFile(join(draftDir, "assets", "diagram.png"), "png", "utf8");

    await publishDraft({ context, slug: "dup-post" });

    await assert.rejects(
      () => publishDraft({ context, slug: "dup-post" }),
      /Preflight failed/u,
    );
  });

  it("detects a slug collision between drafts", async () => {
    const context = await makeContext();
    await scaffoldDraft({ context, slug: "first", date: "2026-01-02" });
    await scaffoldDraft({ context, slug: "second", date: "2026-01-02" });

    await writeFile(
      join(context.draftsDir, "second", "post.md"),
      READY_POST.replace("stage: ready", 'slug: "first"\nstage: ready'),
      "utf8",
    );

    const report = await preflightDraft({ context, slug: "second" });
    assert.equal(
      report.issues.some((issue) =>
        issue.message.includes("already publishes"),
      ),
      true,
    );
  });
});
