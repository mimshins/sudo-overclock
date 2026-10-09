import { blogServices } from "@repo/modules/blog/presentation/blog-module";
import { Heading } from "@repo/shared/ui/heading";
import { Leader } from "@repo/shared/ui/leader";
import { Tag } from "@repo/shared/ui/tag";
import Link from "next/link";

import styles from "./tags.module.css";

export const metadata = {
  title: "tags — sudo-overclock",
  description: "All tags across blog posts.",
};

const TagItem = ({ tag }: { readonly tag: string }) => {
  const count = blogServices.listPostsByTag(tag).length;

  return (
    <li
      key={tag}
      className={styles.item}
      data-slot="tag-index-item"
    >
      <Link
        href={`/blog/tags/${tag}/`}
        className={styles.link}
        data-slot="tags-link"
      >
        <Tag>{tag}</Tag>
        <span
          className={styles.count}
          data-slot="tags-count"
        >
          [ {count} ]
        </span>
      </Link>
    </li>
  );
};

const TagsPage = () => {
  const tags = blogServices.listTags();

  return (
    <main
      id="main"
      className={styles.main}
      data-slot="tags"
    >
      <Leader>tags.md</Leader>
      <Heading
        as="h1"
        size="h1"
        glow
        className={styles.title}
      >
        tags
      </Heading>
      <ul
        className={styles.list}
        data-slot="tag-index"
      >
        {tags.map(tag => (
          <TagItem
            key={tag}
            tag={tag}
          />
        ))}
      </ul>
    </main>
  );
};

export default TagsPage;
