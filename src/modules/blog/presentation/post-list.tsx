/*
 * PostList — server component.
 *
 * Renders a list of post summaries. Posts are passed in as props (server
 * components cannot read context), keeping compiled content out of the client
 * bundle.
 */

import { cx } from "@repo/shared/lib/cx";
import { Tag } from "@repo/shared/ui/tag";
import Link from "next/link";

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
          <Link
            href={`/blog/posts/${post.slug}/`}
            className={styles.link}
          >
            <div className={styles.header} data-slot="post-card-header">
              <h2 className={styles.title}>{post.title}</h2>
              <span className={styles.meta}>
                {post.date} &middot; {post.readingTimeMinutes} min
              </span>
            </div>
            {post.description.length > 0 && (
              <span className={styles.description}>{post.description}</span>
            )}
            {post.tags.length > 0 && (
              <span className={styles.tags} data-slot="post-card-tags">
                {post.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export type { PostListProps };
export { PostList };
