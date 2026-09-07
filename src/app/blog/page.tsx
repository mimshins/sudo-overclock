import { blogServices } from "@repo/modules/blog/presentation/blog-module";
import { PostList } from "@repo/modules/blog/presentation/post-list";
import { Heading } from "@repo/shared/ui/heading";

import styles from "./blog.module.css";

export const metadata = {
  title: "blog — sudo-overclock",
  description: "Engineering blog posts.",
};

const BlogPage = () => {
  const posts = blogServices.listPosts();

  return (
    <main className={styles.main} data-slot="blog">
      <div className={styles.leader} data-slot="leader">
        <span className={styles.leaderDash}>&mdash;&mdash;</span>
        <span className={styles.leaderText}>blog.md</span>
        <span className={styles.leaderDash}>&mdash;&mdash;</span>
      </div>
      <Heading as="h1" size="h1" glow className={styles.title}>
        blog
      </Heading>
      <PostList posts={posts} className={styles.list} />
    </main>
  );
};

export default BlogPage;
