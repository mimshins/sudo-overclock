import { blogServices } from "@repo/modules/blog/presentation/blog-module";
import { PostList } from "@repo/modules/blog/presentation/post-list";
import { Heading } from "@repo/shared/ui/heading";
import { Leader } from "@repo/shared/ui/leader";
import { notFound } from "next/navigation";

import styles from "./tag.module.css";

type TagPageProps = {
  readonly params: Promise<{ readonly tag: string }>;
};

export const generateStaticParams = () =>
  blogServices.listTags().map(tag => ({ tag }));

export const generateMetadata = async ({ params }: TagPageProps) => {
  const { tag } = await params;
  return {
    title: `${tag} — sudo-overclock`,
    description: `Blog posts tagged "${tag}".`,
  };
};

const TagPage = async ({ params }: TagPageProps) => {
  const { tag } = await params;
  const posts = blogServices.listPostsByTag(tag);

  if (posts.length === 0) notFound();

  return (
    <main
      id="main"
      className={styles.main}
      data-slot="tag"
    >
      <Leader>tag: {tag}</Leader>
      <Heading
        as="h1"
        size="h1"
        glow
        className={styles.title}
      >
        #{tag}
      </Heading>
      <PostList
        posts={posts}
        className={styles.list}
      />
    </main>
  );
};

export default TagPage;
