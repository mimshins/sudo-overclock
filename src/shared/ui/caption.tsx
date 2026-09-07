import { cx, type ClassValue } from "@repo/shared/lib/cx";
import type { PolymorphicProps } from "@repo/shared/lib/polymorphic";
import type { ElementType } from "react";

import styles from "./caption.module.css";

type CaptionVariant = "default" | "muted";

type CaptionOwnProps = {
  readonly variant?: CaptionVariant;
  readonly uppercase?: boolean;
};

type CaptionProps<T extends ElementType = "span"> = PolymorphicProps<
  T,
  CaptionOwnProps
>;

const variantClass: Record<CaptionVariant, ClassValue> = {
  default: styles.variantDefault,
  muted: styles.variantMuted,
};

const Caption = <T extends ElementType = "span">({
  as,
  variant = "default",
  uppercase = true,
  className,
  children,
  ...rest
}: CaptionProps<T>) => {
  const Component = as ?? "span";

  return (
    <Component
      className={cx(
        styles.caption,
        variantClass[variant],
        uppercase && styles.uppercase,
        className,
      )}
      data-slot="caption"
      {...rest}
    >
      {children}
    </Component>
  );
};

export type { CaptionProps, CaptionVariant };
export { Caption };
