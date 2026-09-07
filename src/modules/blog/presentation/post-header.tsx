/*
 * PostHeader — server component.
 *
 * Renders a post's title block: slug leader, title, date + reading time, and
 * description.
 */

import { Caption } from "@repo/shared/ui/caption";

import type { Post } from "../domain/post.ts";

import styles from "./post-header.module.css";

type PostHeaderProps = {
  readonly post: Post;
};

const PostHeader = ({ post }: PostHeaderProps) => (
  <header className={styles.header} data-slot="post-header">
    <div className={styles.leader} data-slot="leader">
      <span className={styles.leaderDash}>&mdash;&mdash;</span>
      <span className={styles.leaderText}>{post.frontmatter.slug}.md</span>
      <span className={styles.leaderDash}>&mdash;&mdash;</span>
    </div>
    <h1 className={styles.title}>{post.frontmatter.title}</h1>
    <div className={styles.meta} data-slot="post-meta">
      <Caption variant="muted">{post.frontmatter.date}</Caption>
      <Caption variant="muted">{post.readingTimeMinutes} min read</Caption>
    </div>
    {post.frontmatter.description !== undefined && (
      <p className={styles.description}>{post.frontmatter.description}</p>
    )}
  </header>
);

export type { PostHeaderProps };
export { PostHeader };
