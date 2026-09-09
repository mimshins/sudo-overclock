import { blogServices } from "@repo/modules/blog/presentation/blog-module";
import type { MetadataRoute } from "next";

import { SITE_URL } from "./site.ts";

export const dynamic = "force-static";

const sitemap = (): MetadataRoute.Sitemap => {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now },
    { url: `${SITE_URL}/blog/`, lastModified: now },
    { url: `${SITE_URL}/about/`, lastModified: now },
    { url: `${SITE_URL}/reading/`, lastModified: now },
  ];

  const postRoutes: MetadataRoute.Sitemap = blogServices
    .listPosts()
    .map(post => ({
      url: `${SITE_URL}/blog/posts/${post.slug}/`,
      lastModified: new Date(post.date),
    }));

  const tagRoutes: MetadataRoute.Sitemap = blogServices.listTags().map(tag => ({
    url: `${SITE_URL}/blog/tags/${tag}/`,
    lastModified: now,
  }));

  return [...staticRoutes, ...postRoutes, ...tagRoutes];
};

export default sitemap;
