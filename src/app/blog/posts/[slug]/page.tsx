import { blogServices } from "@repo/modules/blog/presentation/blog-module";
import { PostBody } from "@repo/modules/blog/presentation/post-body";
import { PostHeader } from "@repo/modules/blog/presentation/post-header";
import { TableOfContents } from "@repo/modules/blog/presentation/table-of-contents";
import { Caption } from "@repo/shared/ui/caption";
import { notFound } from "next/navigation";

import styles from "./post.module.css";

type PostPageProps = {
  readonly params: Promise<{ readonly slug: string }>;
};

export const generateStaticParams = () =>
  blogServices.listPosts().map((post) => ({ slug: post.slug }));

export const generateMetadata = async ({ params }: PostPageProps) => {
  const { slug } = await params;
  const post = blogServices.getPost(slug);

  if (post === null) return {};

  return {
    title: `${post.frontmatter.title} — sudo-overclock`,
    description: post.frontmatter.description,
  };
};

const PostPage = async ({ params }: PostPageProps) => {
  const { slug } = await params;
  const post = blogServices.getPost(slug);

  if (post === null) notFound();

  return (
    <main className={styles.main} data-slot="post">
      <article className={styles.article} data-slot="post-article">
        <PostHeader post={post} />
        <PostBody html={post.body} />
      </article>
      <aside className={styles.aside} data-slot="post-aside">
        <Caption variant="muted" className={styles.tocTitle}>
          on this page
        </Caption>
        <TableOfContents items={post.toc} />
      </aside>
    </main>
  );
};

export default PostPage;
