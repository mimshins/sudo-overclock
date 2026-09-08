"use client";

/*
 * PostFilter — client component.
 *
 * The tag filter + sort toolbar for the blog index. Post summaries and tags are
 * passed in as props (server-rendered); only the filter/sort state is hydrated
 * on the client, keeping compiled content out of the client bundle.
 */

import { cx } from "@repo/shared/lib/cx";
import { Button } from "@repo/shared/ui/button";
import { Tag } from "@repo/shared/ui/tag";
import { useCallback, useState } from "react";

import { sortSummaries, type SortOrder } from "../application/blog.ts";
import type { PostSummary } from "../domain/post.ts";
import { PostList } from "./post-list.tsx";

import styles from "./post-filter.module.css";

const ALL_TAGS = "__all__";

type ToolbarProps = {
  readonly tags: readonly string[];
  readonly activeTag: string;
  readonly order: SortOrder;
  readonly onSelectAll: () => void;
  readonly onSelectTag: (tag: string) => void;
  readonly onToggleOrder: () => void;
};

const Toolbar = ({
  tags,
  activeTag,
  order,
  onSelectAll,
  onSelectTag,
  onToggleOrder,
}: ToolbarProps) => (
  <div className={styles.toolbar} data-slot="post-filter-toolbar">
    <div className={styles.tags} data-slot="post-filter-tags">
      <Tag active={activeTag === ALL_TAGS} onClick={onSelectAll}>
        all
      </Tag>
      {tags.map((tag) => (
        <Tag
          key={tag}
          active={activeTag === tag}
          // oxlint-disable-next-line react-perf/jsx-no-new-function-as-prop
          onClick={() => {
            onSelectTag(tag);
          }}
        >
          {tag}
        </Tag>
      ))}
    </div>
    <Button
      variant="ghost"
      color="neutral"
      size="sm"
      className={styles.sort}
      onClick={onToggleOrder}
      aria-label="toggle sort order"
    >
      {order === "newest" ? "[ newest ]" : "[ oldest ]"}
    </Button>
  </div>
);

type PostFilterProps = {
  readonly posts: readonly PostSummary[];
  readonly tags: readonly string[];
  readonly className?: string;
};

const PostFilter = ({ posts, tags, className }: PostFilterProps) => {
  const [activeTag, setActiveTag] = useState<string>(ALL_TAGS);
  const [order, setOrder] = useState<SortOrder>("newest");

  const showAll = useCallback(() => {
    setActiveTag(ALL_TAGS);
  }, []);

  const selectTag = useCallback((tag: string) => {
    setActiveTag(tag);
  }, []);

  const toggleOrder = useCallback(() => {
    setOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
  }, []);

  const visiblePosts = sortSummaries(
    activeTag === ALL_TAGS
      ? posts
      : posts.filter((post) => post.tags.includes(activeTag)),
    order,
  );

  return (
    <div className={cx(styles.filter, className)} data-slot="post-filter">
      <Toolbar
        tags={tags}
        activeTag={activeTag}
        order={order}
        onSelectAll={showAll}
        onSelectTag={selectTag}
        onToggleOrder={toggleOrder}
      />
      <PostList posts={visiblePosts} />
    </div>
  );
};

export type { PostFilterProps };
export { PostFilter };
