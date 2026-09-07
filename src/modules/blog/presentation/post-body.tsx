/*
 * PostBody — server component.
 *
 * Renders the compiled post HTML. The body is generated at build time by the
 * compiler and contains highlighted code, tables, and heading anchors; this
 * component wraps it in a styled prose container.
 */

import { cx } from "@repo/shared/lib/cx";

import styles from "./post-body.module.css";

type PostBodyProps = {
  readonly html: string;
  readonly className?: string;
};

const PostBody = ({ html, className }: PostBodyProps) => (
  <div
    className={cx(styles.prose, className)}
    // The HTML is produced by our own build-time compiler from trusted
    // markdown source. Raw HTML is not allowed through (allowDangerousHtml is
    // off), so this is safe to inject.
    // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop
    dangerouslySetInnerHTML={{ __html: html }}
    data-slot="post-body"
  />
);

export type { PostBodyProps };
export { PostBody };
