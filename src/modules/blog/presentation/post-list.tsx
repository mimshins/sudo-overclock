"use client";

import { cx } from "@repo/shared/lib/cx";

import type { PostSummary } from "../domain/post.ts";
import { useBlogServices } from "./blog-context.ts";

import styles from "./post-list.module.css";

type PostListProps = {
  readonly emptyMessage?: string;
  readonly className?: string;
};

const PostList = ({
  emptyMessage = "no posts yet",
  className,
}: PostListProps) => {
  const { listPosts } = useBlogServices();
  const posts = listPosts();

  if (posts.length === 0) {
    return (
      <p
        className={cx(styles.empty, className)}
        data-slot="empty"
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul
      className={cx(styles.list, className)}
      data-slot="post-list"
    >
      {posts.map((post: PostSummary) => (
        <li
          key={post.id}
          className={styles.item}
          data-slot="post-list-item"
        >
          <a
            href={`/posts/${post.slug}`}
            className={styles.link}
          >
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
