import { blogServices } from "@repo/modules/blog/presentation/blog-module";

import { renderOgCard } from "../../../../og-card.tsx";
import { tagEntry } from "../../../../pages.ts";

type TagCardContext = {
  readonly params: Promise<{ readonly tag: string }>;
};

export const dynamic = "force-static";

export const generateStaticParams = () =>
  blogServices.listTags().map(tag => ({ tag }));

const GET = async (
  _request: Request,
  { params }: TagCardContext,
): Promise<Response> => {
  const { tag } = await params;

  return renderOgCard({ ...tagEntry(tag), title: `#${tag}` });
};

export { GET };
