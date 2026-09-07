import { cx, type ClassValue } from "@repo/shared/lib/cx";
import type { PolymorphicProps } from "@repo/shared/lib/polymorphic";
import type { ElementType } from "react";

import styles from "./kbd.module.css";

type KbdOwnProps = {
  readonly variant?: "default" | "phosphor";
};

type KbdProps<T extends ElementType = "kbd"> = PolymorphicProps<T, KbdOwnProps>;

const variantClass: Record<NonNullable<KbdOwnProps["variant"]>, ClassValue> = {
  default: styles.variantDefault,
  phosphor: styles.variantPhosphor,
};

const Kbd = <T extends ElementType = "kbd">({
  as,
  variant = "default",
  className,
  children,
  ...rest
}: KbdProps<T>) => {
  const Component = as ?? "kbd";

  return (
    <Component
      className={cx(styles.kbd, variantClass[variant], className)}
      data-slot="kbd"
      {...rest}
    >
      {children}
    </Component>
  );
};

export type { KbdProps };
export { Kbd };
