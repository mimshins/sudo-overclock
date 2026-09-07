import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deriveSlug, slugify } from "./slug.ts";

describe("slugify", () => {
  it("lowercases and replaces non-alphanumerics with dashes", () => {
    assert.equal(slugify("Hello World"), "hello-world");
  });

  it("collapses runs of separators into a single dash", () => {
    assert.equal(slugify("Hello   World!"), "hello-world");
  });

  it("trims leading and trailing dashes", () => {
    assert.equal(slugify("--hello--"), "hello");
  });
});

describe("deriveSlug", () => {
  it("prefers the frontmatter slug", () => {
    assert.equal(deriveSlug("posts/01.md", "My Custom Slug"), "my-custom-slug");
  });

  it("falls back to the file base name", () => {
    assert.equal(deriveSlug("hello-world/hello-world.md"), "hello-world");
  });

  it("ignores an empty frontmatter slug", () => {
    assert.equal(deriveSlug("hello-world/hello-world.md", "  "), "hello-world");
  });
});
