import { cx, type ClassValue } from "@repo/shared/lib/cx";
import type { PolymorphicProps } from "@repo/shared/lib/polymorphic";
import type { ElementType } from "react";

import styles from "./heading.module.css";

type HeadingSize = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type HeadingVariant = "default" | "muted" | "phosphor";

type HeadingOwnProps = {
  readonly size?: HeadingSize;
  readonly variant?: HeadingVariant;
  readonly glow?: boolean;
};

type HeadingProps<T extends ElementType = "h2"> = PolymorphicProps<
  T,
  HeadingOwnProps
>;

const sizeClass: Record<HeadingSize, ClassValue> = {
  h1: styles.sizeH1,
  h2: styles.sizeH2,
  h3: styles.sizeH3,
  h4: styles.sizeH4,
  h5: styles.sizeH5,
  h6: styles.sizeH6,
};

const variantClass: Record<HeadingVariant, ClassValue> = {
  default: styles.variantDefault,
  muted: styles.variantMuted,
  phosphor: styles.variantPhosphor,
};

const Heading = <T extends ElementType = "h2">({
  as,
  size = "h2",
  variant = "default",
  glow = false,
  className,
  children,
  ...rest
}: HeadingProps<T>) => {
  const Component = as ?? size;

  return (
    <Component
      className={cx(
        styles.heading,
        sizeClass[size],
        variantClass[variant],
        glow && styles.glow,
        className,
      )}
      data-slot="heading"
      {...rest}
    >
      {children}
    </Component>
  );
};

export type { HeadingProps, HeadingSize, HeadingVariant };
export { Heading };
