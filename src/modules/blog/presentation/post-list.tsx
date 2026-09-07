/*
 * PostList — server component.
 *
 * Renders a list of post summaries. Posts are passed in as props (server
 * components cannot read context), keeping compiled content out of the client
 * bundle.
 */

import { cx } from "@repo/shared/lib/cx";

import type { PostSummary } from "../domain/post.ts";

import styles from "./post-list.module.css";

type PostListProps = {
  readonly posts: readonly PostSummary[];
  readonly className?: string;
};

const PostList = ({ posts, className }: PostListProps) => {
  if (posts.length === 0) {
    return (
      <p className={cx(styles.empty, className)} data-slot="empty">
        no posts yet
      </p>
    );
  }

  return (
    <ul className={cx(styles.list, className)} data-slot="post-list">
      {posts.map((post) => (
        <li key={post.id} className={styles.item} data-slot="post-list-item">
          <a href={`/blog/posts/${post.slug}/`} className={styles.link}>
            <span className={styles.title}>{post.title}</span>
            <span className={styles.meta}>
              {post.date} &middot; {post.readingTimeMinutes} min
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
};

export type { PostListProps };
export { PostList };
