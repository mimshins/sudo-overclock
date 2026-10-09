import { describe, expect, it } from "vitest";

import {
  articleMetadata,
  ogImagePath,
  pageMetadata,
  routePath,
} from "./metadata.ts";
import { PAGES, postPath, tagEntry, tagPath } from "./pages.ts";

describe("pageMetadata", () => {
  it("titles, canonicalises, and points og/twitter at the route's card", () => {
    const metadata = pageMetadata({
      title: "about",
      description: "About me.",
      path: "/about/",
    });

    expect(metadata.title).toBe("about — sudo-overclock");
    expect(metadata.alternates).toEqual({ canonical: "/about/" });
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      url: "/about/",
      title: "about — sudo-overclock",
      description: "About me.",
      images: [
        {
          url: "/about/og.png",
          width: 1200,
          height: 630,
          alt: "about — sudo-overclock",
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: [{ url: "/about/og.png" }],
    });
  });

  it("uses the bare site name for home", () => {
    const metadata = pageMetadata({ path: "/" });

    expect(metadata.title).toBe("sudo-overclock");
    expect(metadata.openGraph).toMatchObject({
      images: [{ url: "/og.png", alt: "sudo-overclock" }],
    });
  });

  it("leaves pages without a path uncanonicalised on the home card", () => {
    const metadata = pageMetadata({ title: "404", description: "Gone." });

    expect(metadata.alternates).toBeUndefined();
    expect(metadata.openGraph).not.toHaveProperty("url");
    expect(metadata.openGraph).toMatchObject({
      images: [{ url: "/og.png", alt: "sudo-overclock" }],
    });
  });
});

describe("articleMetadata", () => {
  it("marks posts as articles with date, author, and tags", () => {
    const metadata = articleMetadata({
      title: "Hello",
      path: "/blog/posts/hello/",
      publishedTime: "2026-02-07",
      tags: ["meta"],
    });

    expect(metadata.openGraph).toMatchObject({
      type: "article",
      url: "/blog/posts/hello/",
      publishedTime: "2026-02-07",
      authors: ["Mostafa Shamsitabar"],
      tags: ["meta"],
      images: [{ url: "/blog/posts/hello/og.png" }],
    });
  });
});

describe("ogImagePath", () => {
  it("appends the card file to a trailing-slash path", () => {
    expect(ogImagePath("/blog/tags/meta/")).toBe("/blog/tags/meta/og.png");
    expect(ogImagePath()).toBe("/og.png");
  });
});

describe("routePath", () => {
  it("roots and closes every path with a slash", () => {
    expect(routePath("/about/")).toBe("/about/");
    expect(routePath("/about")).toBe("/about/");
    expect(routePath("about")).toBe("/about/");
    expect(ogImagePath("/about")).toBe("/about/og.png");
  });

  it("canonicalises a path given without its trailing slash", () => {
    const metadata = pageMetadata({ title: "about", path: "/about" });

    expect(metadata.alternates).toEqual({ canonical: "/about/" });
    expect(metadata.openGraph).toMatchObject({
      url: "/about/",
      images: [{ url: "/about/og.png" }],
    });
  });
});

describe("page table", () => {
  it("closes every static page path with a slash", () => {
    for (const page of Object.values(PAGES)) {
      expect(routePath(page.path)).toBe(page.path);
    }
  });

  it("percent-encodes tags and slugs so reserved characters stay in the path", () => {
    expect(tagPath("c#")).toBe("/blog/tags/c%23/");
    expect(tagEntry("c#").path).toBe("/blog/tags/c%23/");
    expect(postPath("hello-world")).toBe("/blog/posts/hello-world/");
    expect(new URL(tagPath("c#"), "https://example.com").pathname).toBe(
      "/blog/tags/c%23/",
    );
  });
});
