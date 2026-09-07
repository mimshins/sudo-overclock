"use client";

/*
 * TableOfContents — client component.
 *
 * Renders the post's heading anchors as an ordered list and highlights the
 * section currently in the viewport using an IntersectionObserver. The `toc`
 * items are passed in as props (server-rendered); only the observer + active
 * state are hydrated on the client.
 */

import { cx } from "@repo/shared/lib/cx";
import { useEffect, useState } from "react";

import type { PostTocItem } from "../domain/post.ts";

import styles from "./table-of-contents.module.css";

type TableOfContentsProps = {
  readonly items: readonly PostTocItem[];
  readonly className?: string;
};

const selectSections = (items: readonly PostTocItem[]): HTMLElement[] =>
  items
    .map((item) => document.querySelector<HTMLElement>(`#${item.id}`))
    .filter((el): el is HTMLElement => el !== null);

const useActiveSection = (items: readonly PostTocItem[]): string | null => {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const sections = selectSections(items);
    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.intersectionRatio);
          } else {
            visible.delete(entry.target.id);
          }
        }

        let best: string | null = null;
        let bestRatio = 0;

        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        }

        setActiveId(best);
      },
      {
        rootMargin: "-10% 0px -80% 0px",
        threshold: [0, 0.25, 0.5, 1],
      },
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => {
      observer.disconnect();
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
      <ol className={styles.list} data-slot="toc-list">
        {items.map((item) => (
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
