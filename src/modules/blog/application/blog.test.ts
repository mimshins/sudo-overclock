import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Post, PostSummary } from "../domain/post.ts";
import { createBlogServices } from "./blog.ts";
import type { ContentRepository } from "./ports/content-repository.ts";

const summary = (overrides: Partial<PostSummary> = {}): PostSummary => ({
  id: "hello-world",
  slug: "hello-world",
  title: "Hello, Overclock",
  date: "2026-02-07",
  description: "",
  tags: [],
  readingTimeMinutes: 1,
  ...overrides,
});

const createRepository = (
  posts: readonly PostSummary[],
): ContentRepository => ({
  getAllPostSummaries: () => posts,
  getPostBySlug: (_slug: string): Post | null => null,
});

describe("createBlogServices", () => {
  it("sorts posts newest first", () => {
    const services = createBlogServices({
      contentRepository: createRepository([
        summary({ id: "old", date: "2026-01-01", title: "Old" }),
        summary({ id: "new", date: "2026-03-01", title: "New" }),
      ]),
    });

    assert.deepEqual(
      services.listPosts().map((post) => post.id),
      ["new", "old"],
    );
  });

  it("lists unique sorted tags", () => {
    const services = createBlogServices({
      contentRepository: createRepository([
        summary({ tags: ["b", "a"] }),
        summary({ tags: ["a", "c"] }),
      ]),
    });

    assert.deepEqual(services.listTags(), ["a", "b", "c"]);
  });

  it("filters posts by tag", () => {
    const services = createBlogServices({
      contentRepository: createRepository([
        summary({ id: "meta-post", tags: ["meta"] }),
        summary({ id: "other-post", tags: ["other"] }),
      ]),
    });

    assert.deepEqual(
      services.listPostsByTag("meta").map((post) => post.id),
      ["meta-post"],
    );
  });

  it("returns an empty list for an unknown tag", () => {
    const services = createBlogServices({
      contentRepository: createRepository([summary()]),
    });

    assert.deepEqual(services.listPostsByTag("missing"), []);
  });
});
