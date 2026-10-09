import { blogServices } from "@repo/modules/blog/presentation/blog-module";

import { renderOgCard } from "../../../../og-card.tsx";
import { postPath } from "../../../../pages.ts";

type PostCardContext = {
  readonly params: Promise<{ readonly slug: string }>;
};

export const dynamic = "force-static";

export const generateStaticParams = () =>
  blogServices.listPosts().map(post => ({ slug: post.slug }));

const GET = async (
  _request: Request,
  { params }: PostCardContext,
): Promise<Response> => {
  const { slug } = await params;
  const post = blogServices.getPost(slug);

  if (post === null) return new Response("not found", { status: 404 });

  return renderOgCard({
    leader: `${slug}.md`,
    title: post.frontmatter.title,
    path: postPath(slug),
    background: "blog",
    meta: `${post.frontmatter.date} · ${post.readingTimeMinutes} min read`,
  });
};

export { GET };
