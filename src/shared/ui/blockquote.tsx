import { cx } from "@repo/shared/lib/cx";
import type { PolymorphicProps } from "@repo/shared/lib/polymorphic";
import type { ElementType, ReactNode } from "react";

import styles from "./blockquote.module.css";

type BlockquoteOwnProps = {
  readonly cite?: string;
  readonly children: ReactNode;
};

type BlockquoteProps<T extends ElementType = "blockquote"> = PolymorphicProps<
  T,
  BlockquoteOwnProps
>;

const Blockquote = <T extends ElementType = "blockquote">({
  as,
  cite,
  className,
  children,
  ...rest
}: BlockquoteProps<T>) => {
  const Component = as ?? "blockquote";

  return (
    <Component
      className={cx(styles.blockquote, className)}
      cite={cite}
      data-slot="blockquote"
      {...rest}
    >
      <span
        className={styles.marker}
        data-slot="blockquote-marker"
      >
        {"“"}
      </span>
      <div
        className={styles.body}
        data-slot="blockquote-body"
      >
        {children}
      </div>
    </Component>
  );
};

export type { BlockquoteProps };
export { Blockquote };
