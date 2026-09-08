import { blogServices } from "@repo/modules/blog/presentation/blog-module";
import { PostList } from "@repo/modules/blog/presentation/post-list";
import { Heading } from "@repo/shared/ui/heading";
import { notFound } from "next/navigation";

import styles from "./tag.module.css";

type TagPageProps = {
  readonly params: Promise<{ readonly tag: string }>;
};

export const generateStaticParams = () =>
  blogServices.listTags().map((tag) => ({ tag }));

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
    <main className={styles.main} data-slot="tag">
      <div className={styles.leader} data-slot="leader">
        <span className={styles.leaderDash}>&mdash;&mdash;</span>
        <span className={styles.leaderText}>tag: {tag}</span>
        <span className={styles.leaderDash}>&mdash;&mdash;</span>
      </div>
      <Heading as="h1" size="h1" glow className={styles.title}>
        #{tag}
      </Heading>
      <PostList posts={posts} className={styles.list} />
    </main>
  );
};

export default TagPage;
