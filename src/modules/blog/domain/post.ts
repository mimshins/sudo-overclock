/*
 * Domain types for blog content.
 *
 * The domain layer is the most inner layer in our DDD setup. It has NO imports
 * outside the module. It is pure types and value objects.
 */

type PostId = string;

type PostFrontmatter = {
  readonly slug: string;
  readonly title: string;
  readonly date: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly author?: string;
};

type PostTocItem = {
  readonly id: string;
  readonly text: string;
  readonly depth: number;
};

type Post = {
  readonly id: PostId;
  readonly frontmatter: PostFrontmatter;
  readonly body: string;
  readonly readingTimeMinutes: number;
  readonly toc: readonly PostTocItem[];
};

type PostSummary = {
  readonly id: PostId;
  readonly slug: string;
  readonly title: string;
  readonly date: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly readingTimeMinutes: number;
};

export type { PostId, PostFrontmatter, PostTocItem, Post, PostSummary };
