import { Button as BaseButton } from "@base-ui/react/button";
import { cx, type ClassValue } from "@repo/shared/lib/cx";
import type { PolymorphicProps } from "@repo/shared/lib/polymorphic";
import type * as React from "react";

import styles from "./button.module.css";

type Variant = "ghost" | "outlined" | "filled";
type Color = "neutral" | "phosphor" | "positive" | "negative" | "warn" | "info";
type Size = "sm" | "md" | "lg";

type ButtonOwnProps = {
  readonly variant?: Variant;
  readonly color?: Color;
  readonly size?: Size;
};

type ButtonProps<T extends React.ElementType = typeof BaseButton> =
  PolymorphicProps<T, ButtonOwnProps>;

const variantClass: Record<Variant, ClassValue> = {
  ghost: styles.variantGhost,
  outlined: styles.variantOutlined,
  filled: styles.variantFilled,
};

const colorClass: Record<Color, ClassValue> = {
  neutral: styles.colorNeutral,
  phosphor: styles.colorPhosphor,
  positive: styles.colorPositive,
  negative: styles.colorNegative,
  warn: styles.colorWarn,
  info: styles.colorInfo,
};

const sizeClass: Record<Size, ClassValue> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

const Button = <T extends React.ElementType = typeof BaseButton>({
  variant = "outlined",
  color = "phosphor",
  size = "md",
  className,
  children,
  as,
  ...rest
}: ButtonProps<T>) => {
  const Component = (as ?? BaseButton) as React.ElementType;

  return (
    <Component
      className={cx(
        styles.button,
        variantClass[variant],
        colorClass[color],
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

export type { ButtonProps, Variant, Color, Size };
export { Button };
