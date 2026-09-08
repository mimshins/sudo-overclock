/*
 * Application services — use cases that orchestrate the domain.
 *
 * These are the only entry points into the module's logic. Presentation never
 * reaches into infrastructure directly; it asks the application service which
 * uses the ports declared in `application/ports/`.
 */

import type { Post, PostSummary } from "../domain/post.ts";
import type { ContentRepository } from "./ports/content-repository.ts";

type SortOrder = "newest" | "oldest";

type CreateBlogServicesOptions = {
  readonly contentRepository: ContentRepository;
};

type BlogServices = {
  readonly listPosts: () => readonly PostSummary[];
  readonly getPost: (slug: string) => Post | null;
  readonly listTags: () => readonly string[];
  readonly listPostsByTag: (tag: string) => readonly PostSummary[];
};

/**
 * Sort post summaries by publication date. `newest` (default) puts the most
 * recent first; posts with equal dates tie-break by title for stability.
 */
const sortSummaries = (
  summaries: readonly PostSummary[],
  order: SortOrder = "newest",
): readonly PostSummary[] => {
  const direction = order === "oldest" ? 1 : -1;

  return summaries.toSorted((a, b) => {
    if (a.date === b.date) return a.title.localeCompare(b.title);
    return direction * a.date.localeCompare(b.date);
  });
};

const createBlogServices = (
  options: CreateBlogServicesOptions,
): BlogServices => {
  const { contentRepository } = options;

  return {
    listPosts: () => sortSummaries(contentRepository.getAllPostSummaries()),
    getPost: (slug) => contentRepository.getPostBySlug(slug),
    listTags: () => {
      const tags = new Set<string>();
      for (const summary of contentRepository.getAllPostSummaries()) {
        for (const tag of summary.tags) tags.add(tag);
      }
      return [...tags].toSorted((a, b) => a.localeCompare(b));
    },
    listPostsByTag: (tag) =>
      sortSummaries(
        contentRepository
          .getAllPostSummaries()
          .filter((summary) => summary.tags.includes(tag)),
      ),
  };
};

export { createBlogServices, sortSummaries };
export type { BlogServices, CreateBlogServicesOptions, SortOrder };
