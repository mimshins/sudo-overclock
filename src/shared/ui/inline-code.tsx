import { cx, type ClassValue } from "@repo/shared/lib/cx";
import type { PolymorphicProps } from "@repo/shared/lib/polymorphic";
import type { ElementType } from "react";

import styles from "./inline-code.module.css";

type InlineCodeOwnProps = {
  readonly variant?: "default" | "phosphor";
};

type InlineCodeProps<T extends ElementType = "code"> = PolymorphicProps<
  T,
  InlineCodeOwnProps
>;

const variantClass: Record<
  NonNullable<InlineCodeOwnProps["variant"]>,
  ClassValue
> = {
  default: styles.variantDefault,
  phosphor: styles.variantPhosphor,
};

const InlineCode = <T extends ElementType = "code">({
  as,
  variant = "default",
  className,
  children,
  ...rest
}: InlineCodeProps<T>) => {
  const Component = as ?? "code";

  return (
    <Component
      className={cx(styles.inlineCode, variantClass[variant], className)}
      data-slot="inline-code"
      {...rest}
    >
      {children}
    </Component>
  );
};

export type { InlineCodeProps };
export { InlineCode };
