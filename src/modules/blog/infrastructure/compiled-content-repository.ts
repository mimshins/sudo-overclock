/*
 * Compiled content adapter.
 *
 * Reads the compiler's generated output from `modules/blog/content/compiled/`
 * and adapts it to the domain `Post` / `PostSummary` shapes consumed by the
 * application layer.
 */

import type { ContentRepository } from "../application/ports/content-repository.ts";
import { compiledPosts } from "../content/compiled/index.ts";
import type { Post, PostSummary } from "../domain/post.ts";
import type { CompiledPost } from "./compiler/types.ts";

const toSummary = (post: CompiledPost): PostSummary => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  date: post.date,
  description: post.description,
  tags: post.tags,
  readingTimeMinutes: post.readingTimeMinutes,
});

const toPost = (post: CompiledPost): Post => ({
  id: post.id,
  frontmatter: {
    slug: post.slug,
    title: post.title,
    date: post.date,
    description: post.description,
    tags: post.tags,
    ...(post.author === undefined ? {} : { author: post.author }),
  },
  body: post.body,
  readingTimeMinutes: post.readingTimeMinutes,
  toc: post.toc,
});

const createCompiledContentRepository = (): ContentRepository => {
  const posts: readonly Post[] = compiledPosts.map(post => toPost(post));
  const summaries: readonly PostSummary[] = compiledPosts.map(post =>
    toSummary(post),
  );

  return {
    getAllPostSummaries: () => summaries,
    getPostBySlug: slug =>
      posts.find(post => post.frontmatter.slug === slug) ?? null,
  };
};

export { createCompiledContentRepository };
