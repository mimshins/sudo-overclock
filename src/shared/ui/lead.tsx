import { cx, type ClassValue } from "@repo/shared/lib/cx";
import type { PolymorphicProps } from "@repo/shared/lib/polymorphic";
import type { ElementType } from "react";

import styles from "./lead.module.css";

type LeadSize = "subheading1" | "subheading2";
type LeadVariant = "default" | "muted" | "phosphor";

type LeadOwnProps = {
  readonly size?: LeadSize;
  readonly variant?: LeadVariant;
};

type LeadProps<T extends ElementType = "p"> = PolymorphicProps<T, LeadOwnProps>;

const sizeClass: Record<LeadSize, ClassValue> = {
  subheading1: styles.sizeSubheading1,
  subheading2: styles.sizeSubheading2,
};

const variantClass: Record<LeadVariant, ClassValue> = {
  default: styles.variantDefault,
  muted: styles.variantMuted,
  phosphor: styles.variantPhosphor,
};

const Lead = <T extends ElementType = "p">({
  as,
  size = "subheading1",
  variant = "default",
  className,
  children,
  ...rest
}: LeadProps<T>) => {
  const Component = as ?? "p";

  return (
    <Component
      className={cx(
        styles.lead,
        sizeClass[size],
        variantClass[variant],
        className,
      )}
      data-slot="lead"
      {...rest}
    >
      {children}
    </Component>
  );
};

export type { LeadProps, LeadSize, LeadVariant };
export { Lead };
