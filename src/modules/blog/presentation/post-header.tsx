/*
 * PostHeader — server component.
 *
 * Renders a post's title block: slug leader, title, date + reading time, and
 * description.
 */

import { Caption } from "@repo/shared/ui/caption";
import { Heading } from "@repo/shared/ui/heading";
import { Leader } from "@repo/shared/ui/leader";

import type { Post } from "../domain/post.ts";

import styles from "./post-header.module.css";

type PostHeaderProps = {
  readonly post: Post;
};

const PostHeader = ({ post }: PostHeaderProps) => (
  <header
    className={styles.header}
    data-slot="post-header"
  >
    <Leader>{post.frontmatter.slug}.md</Leader>
    <Heading
      as="h1"
      size="h1"
      glow
      className={styles.title}
    >
      {post.frontmatter.title}
    </Heading>
    <div
      className={styles.meta}
      data-slot="post-meta"
    >
      <Caption variant="default">{post.frontmatter.date}</Caption>
      <Caption variant="default">{post.readingTimeMinutes} min read</Caption>
    </div>
    {post.frontmatter.description !== undefined && (
      <p
        className={styles.description}
        data-slot="post-description"
      >
        {post.frontmatter.description}
      </p>
    )}
  </header>
);

export type { PostHeaderProps };
export { PostHeader };
