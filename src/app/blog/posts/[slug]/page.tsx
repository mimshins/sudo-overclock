import { blogServices } from "@repo/modules/blog/presentation/blog-module";
import { CodeCopy } from "@repo/modules/blog/presentation/code-copy";
import { PostBody } from "@repo/modules/blog/presentation/post-body";
import { PostHeader } from "@repo/modules/blog/presentation/post-header";
import { PostImages } from "@repo/modules/blog/presentation/post-images";
import { TableOfContents } from "@repo/modules/blog/presentation/table-of-contents";
import { notFound } from "next/navigation";

import { articleMetadata } from "../../../metadata.ts";
import { postPath } from "../../../pages.ts";

import styles from "./post.module.css";

type PostPageProps = {
  readonly params: Promise<{ readonly slug: string }>;
};

export const generateStaticParams = () =>
  blogServices.listPosts().map(post => ({ slug: post.slug }));

export const generateMetadata = async ({ params }: PostPageProps) => {
  const { slug } = await params;
  const post = blogServices.getPost(slug);

  if (post === null) return {};

  return articleMetadata({
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    path: postPath(slug),
    publishedTime: post.frontmatter.date,
    author: post.frontmatter.author,
    tags: post.frontmatter.tags,
  });
};

const PostPage = async ({ params }: PostPageProps) => {
  const { slug } = await params;
  const post = blogServices.getPost(slug);

  if (post === null) notFound();

  return (
    <main
      id="main"
      className={styles.main}
      data-slot="post"
    >
      <article
        className={styles.article}
        data-slot="post-article"
      >
        <PostHeader post={post} />
        <PostBody html={post.body} />
        <CodeCopy />
        <PostImages />
      </article>
      <aside
        className={styles.aside}
        data-slot="post-aside"
      >
        <TableOfContents items={post.toc} />
      </aside>
    </main>
  );
};

export default PostPage;
