import { cx, type ClassValue } from "@repo/shared/lib/cx";
import type { PolymorphicProps } from "@repo/shared/lib/polymorphic";
import type { ElementType } from "react";

import styles from "./paragraph.module.css";

type ParagraphSize = "body1" | "body2";
type ParagraphVariant = "default" | "muted";

type ParagraphOwnProps = {
  readonly size?: ParagraphSize;
  readonly variant?: ParagraphVariant;
};

type ParagraphProps<T extends ElementType = "p"> = PolymorphicProps<
  T,
  ParagraphOwnProps
>;

const sizeClass: Record<ParagraphSize, ClassValue> = {
  body1: styles.sizeBody1,
  body2: styles.sizeBody2,
};

const variantClass: Record<ParagraphVariant, ClassValue> = {
  default: styles.variantDefault,
  muted: styles.variantMuted,
};

const Paragraph = <T extends ElementType = "p">({
  as,
  size = "body1",
  variant = "default",
  className,
  children,
  ...rest
}: ParagraphProps<T>) => {
  const Component = as ?? "p";

  return (
    <Component
      className={cx(
        styles.paragraph,
        sizeClass[size],
        variantClass[variant],
        className,
      )}
      data-slot="paragraph"
      {...rest}
    >
      {children}
    </Component>
  );
};

export type { ParagraphProps, ParagraphSize, ParagraphVariant };
export { Paragraph };
