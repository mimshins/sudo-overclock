import { blogServices } from "@repo/modules/blog/presentation/blog-module";
import { PostFilter } from "@repo/modules/blog/presentation/post-filter";
import { Heading } from "@repo/shared/ui/heading";
import { Leader } from "@repo/shared/ui/leader";
import { PhosphorField } from "@repo/shared/ui/phosphor-field";

import styles from "./blog.module.css";

export const metadata = {
  title: "blog — sudo-overclock",
  description: "Engineering blog posts.",
};

const BlogPage = () => {
  const posts = blogServices.listPosts();
  const tags = blogServices.listTags();

  return (
    <main
      id="main"
      className={`${styles.main} noise`}
      data-slot="blog"
    >
      <PhosphorField
        src="/blog/bg.jpg"
        glowOnHover={false}
      />
      <Leader>blog.md</Leader>
      <Heading
        as="h1"
        size="h1"
        glow
        className={styles.title}
      >
        blog
      </Heading>
      <PostFilter
        posts={posts}
        tags={tags}
        className={styles.list}
      />
    </main>
  );
};

export default BlogPage;
