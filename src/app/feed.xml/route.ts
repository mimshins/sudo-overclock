import { blogServices } from "@repo/modules/blog/presentation/blog-module";

import { AUTHOR_NAME, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../site.ts";

export const dynamic = "force-static";

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const rfc822 = (date: string): string =>
  new Date(`${date}T00:00:00Z`).toUTCString();

const GET = (): Response => {
  const posts = blogServices.listPosts();

  const items = posts
    .map(post => {
      const url = `${SITE_URL}/blog/posts/${post.slug}/`;
      return [
        "<item>",
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        `<pubDate>${rfc822(post.date)}</pubDate>`,
        `<description>${escapeXml(post.description)}</description>`,
        "</item>",
      ].join("");
    })
    .join("\n    ");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${escapeXml(SITE_NAME)}</title>`,
    `    <link>${SITE_URL}</link>`,
    `    <description>${escapeXml(SITE_DESCRIPTION)}</description>`,
    `    <managingEditor>${escapeXml(AUTHOR_NAME)}</managingEditor>`,
    `    <webMaster>${escapeXml(AUTHOR_NAME)}</webMaster>`,
    `    <language>en</language>`,
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    `    ${items}`,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
};

export { GET };
