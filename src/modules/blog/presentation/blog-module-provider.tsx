"use client";

import type { ReactNode } from "react";

import { createBlogServices } from "../application/blog.ts";
import { createCompiledContentRepository } from "../infrastructure/compiled-content-repository.ts";
import { BlogServicesContext } from "./blog-context.ts";

/**
 * Module composition root.
 *
 * Lives in `presentation/` so the app layer can mount it without ever reaching
 * into `application/` or `infrastructure/`. The presentation context is the
 * single boundary other modules see.
 */
const blogServices = createBlogServices({
  contentRepository: createCompiledContentRepository(),
});

type BlogModuleProviderProps = {
  readonly children: ReactNode;
};

const BlogModuleProvider = (props: BlogModuleProviderProps): ReactNode => {
  const { children } = props;
  return (
    <BlogServicesContext value={blogServices}>{children}</BlogServicesContext>
  );
};

export { BlogModuleProvider, blogServices };
