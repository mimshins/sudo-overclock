import { SITE_DESCRIPTION, SITE_NAME } from "./site.ts";

type PageEntry = {
  readonly path: string;
  readonly title: string;
  readonly leader: string;
  readonly description: string;
  readonly background: string | null;
};

const PAGES = {
  home: {
    path: "/",
    title: SITE_NAME,
    leader: "home.sh",
    description: SITE_DESCRIPTION,
    background: null,
  },
  blog: {
    path: "/blog/",
    title: "blog",
    leader: "blog.md",
    description: "Engineering blog posts.",
    background: "blog",
  },
  tags: {
    path: "/blog/tags/",
    title: "tags",
    leader: "tags.md",
    description: "All tags across blog posts.",
    background: "blog",
  },
  reading: {
    path: "/reading/",
    title: "reading",
    leader: "reading.md",
    description: "Technical books on the desk of @mimshins.",
    background: "reading",
  },
  about: {
    path: "/about/",
    title: "about",
    leader: "about.md",
    description: "About Mostafa Shamsitabar.",
    background: "about",
  },
} as const satisfies Record<string, PageEntry>;

const postPath = (slug: string): string =>
  `/blog/posts/${encodeURIComponent(slug)}/`;

const tagPath = (tag: string): string =>
  `/blog/tags/${encodeURIComponent(tag)}/`;

const tagEntry = (tag: string): PageEntry => ({
  path: tagPath(tag),
  title: tag,
  leader: `tag: ${tag}`,
  description: `Blog posts tagged "${tag}".`,
  background: "blog",
});

export type { PageEntry };
export { PAGES, postPath, tagEntry, tagPath };
