"use client";

/*
 * TableOfContents — client component.
 *
 * Renders the post's heading anchors as an ordered list and highlights the
 * section currently being read. A section is "active" from when its heading
 * crosses a reference line near the top of the viewport until the next
 * heading crosses it, so the entry stays selected while you read the body,
 * not only while the header itself is on screen. The `toc` items are passed
 * in as props (server-rendered); only the scroll tracking + active state are
 * hydrated on the client.
 */

import { cx } from "@repo/shared/lib/cx";
import { useEffect, useState } from "react";

import type { PostTocItem } from "../domain/post.ts";

import styles from "./table-of-contents.module.css";

type TableOfContentsProps = {
  readonly items: readonly PostTocItem[];
  readonly className?: string;
};

const PICK_REFERENCE_LINE = 0.3;

const findHeadingEls = (items: readonly PostTocItem[]): HTMLElement[] =>
  items
    .map(item => document.querySelector<HTMLElement>(`#${item.id}`))
    .filter((el): el is HTMLElement => el !== null);

const pickActiveId = (headings: readonly HTMLElement[]): string | null => {
  const line = window.innerHeight * PICK_REFERENCE_LINE;
  let current: string | null = null;

  for (const heading of headings) {
    if (heading.getBoundingClientRect().top <= line) {
      current = heading.id;
    } else {
      break;
    }
  }

  const atBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 2;
  if (current === null && atBottom) {
    current = headings.at(-1)?.id ?? null;
  }

  return current;
};

const useActiveSection = (items: readonly PostTocItem[]): string | null => {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const headings = findHeadingEls(items);

    let frame: number | null = null;

    const update = (): void => {
      frame = null;
      setActiveId(pickActiveId(headings));
    };

    const schedule = (): void => {
      frame ??= requestAnimationFrame(update);
    };

    if (headings.length > 0) update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  return activeId;
};

const TableOfContents = ({ items, className }: TableOfContentsProps) => {
  const activeId = useActiveSection(items);

  if (items.length === 0) return null;

  return (
    <nav
      className={cx(styles.nav, className)}
      aria-label="table of contents"
      data-slot="toc"
    >
      <ol
        className={styles.list}
        data-slot="toc-list"
      >
        {items.map(item => (
          <li
            key={item.id}
            className={styles.item}
            data-depth={item.depth}
            data-slot="toc-item"
          >
            <a
              href={`#${item.id}`}
              className={cx(styles.link, item.id === activeId && styles.active)}
              aria-current={item.id === activeId ? "location" : undefined}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export type { TableOfContentsProps };
export { TableOfContents };
