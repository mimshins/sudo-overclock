/*
 * Application services — use cases that orchestrate the domain.
 *
 * These are the only entry points into the module's logic. Presentation never
 * reaches into infrastructure directly; it asks the application service which
 * uses the ports declared in `application/ports/`.
 */

import type { Post, PostSummary } from "../domain/post.ts";
import type { ContentRepository } from "./ports/content-repository.ts";

type CreateBlogServicesOptions = {
  readonly contentRepository: ContentRepository;
};

type BlogServices = {
  readonly listPosts: () => readonly PostSummary[];
  readonly getPost: (slug: string) => Post | null;
};

const createBlogServices = (
  options: CreateBlogServicesOptions,
): BlogServices => {
  const { contentRepository } = options;
  return {
    listPosts: () => contentRepository.getAllPostSummaries(),
    getPost: slug => contentRepository.getPostBySlug(slug),
  };
};

export { createBlogServices };
export type { BlogServices, CreateBlogServicesOptions };
