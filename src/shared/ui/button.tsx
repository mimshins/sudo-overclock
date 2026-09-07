import { Button as BaseButton } from "@base-ui/react/button";
import { cx, type ClassValue } from "@repo/shared/lib/cx";
import type { PolymorphicProps } from "@repo/shared/lib/polymorphic";
import type * as React from "react";

import styles from "./button.module.css";

type Variant = "neutral" | "phosphor" | "ghost" | "positive" | "negative";
type Size = "sm" | "md" | "lg";

type ButtonOwnProps = {
  readonly variant?: Variant;
  readonly size?: Size;
};

type ButtonProps<T extends React.ElementType = typeof BaseButton> =
  PolymorphicProps<T, ButtonOwnProps>;

const variantClass: Record<Variant, ClassValue> = {
  neutral: styles.variantNeutral,
  phosphor: styles.variantPhosphor,
  ghost: styles.variantGhost,
  positive: styles.variantPositive,
  negative: styles.variantNegative,
};

const sizeClass: Record<Size, ClassValue> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

const Button = <T extends React.ElementType = typeof BaseButton>({
  variant = "phosphor",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps<T>) => {
  const Component = (rest.as ?? BaseButton) as React.ElementType;

  return (
    <Component
      className={cx(
        styles.button,
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      data-slot="button"
      {...rest}
    >
      {children}
    </Component>
  );
};

export type { ButtonProps, Variant, Size };
export { Button };
