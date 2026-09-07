/*
 * Blog module composition root (server-safe).
 *
 * This is the single place that wires the compiled-content adapter into the
 * application services. It has no `"use client"` directive, so server pages
 * (home, `[slug]`) can import `blogServices` directly at build time and keep
 * the compiled content out of the client bundle.
 *
 * Interactive client features should declare their own context provider rather
 * than turning this module into a client boundary.
 */

import { createBlogServices } from "../application/blog.ts";
import { createCompiledContentRepository } from "../infrastructure/compiled-content-repository.ts";

const blogServices = createBlogServices({
  contentRepository: createCompiledContentRepository(),
});

export { blogServices };
