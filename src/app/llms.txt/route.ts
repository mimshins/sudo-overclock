import { blogServices } from "@repo/modules/blog/presentation/blog-module";

import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../site.ts";

export const dynamic = "force-static";

const GET = (): Response => {
  const posts = blogServices.listPosts();
  const tags = blogServices.listTags();

  const pages = [
    `- [Home](${SITE_URL}/): Landing page.`,
    `- [Blog](${SITE_URL}/blog/): All published posts.`,
    `- [About](${SITE_URL}/about/): About the author and the blog.`,
    `- [Reading](${SITE_URL}/reading/): Books the author is reading.`,
    `- [RSS feed](${SITE_URL}/feed.xml): Subscribe to new posts.`,
  ];

  const postLines = posts.map(
    post =>
      `- [${post.title}](${SITE_URL}/blog/posts/${post.slug}/): ${post.description}`,
  );

  const tagLines = tags.map(tag => `- [${tag}](${SITE_URL}/blog/tags/${tag}/)`);

  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "## Pages",
    "",
    ...pages,
    "",
    "## Posts",
    "",
    ...postLines,
    "",
    "## Tags",
    "",
    ...tagLines,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
};

export { GET };
