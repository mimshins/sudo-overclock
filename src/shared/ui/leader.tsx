import { cx } from "@repo/shared/lib/cx";
import type { PolymorphicProps } from "@repo/shared/lib/polymorphic";
import type { ElementType } from "react";

import styles from "./leader.module.css";

const LEADER_RULE = "─".repeat(4);

type LeaderProps<T extends ElementType = "div"> = PolymorphicProps<
  T,
  Record<never, never>
>;

const Leader = <T extends ElementType = "div">({
  as,
  className,
  children,
  ...rest
}: LeaderProps<T>) => {
  const Component = as ?? "div";

  return (
    <Component
      className={cx(styles.leader, className)}
      data-slot="leader"
      {...rest}
    >
      <span
        className={styles.rule}
        data-slot="leader-rule"
        aria-hidden="true"
      >
        {LEADER_RULE}
      </span>
      <span
        className={styles.label}
        data-slot="leader-label"
      >
        {children}
      </span>
      <span
        className={styles.rule}
        data-slot="leader-rule"
        aria-hidden="true"
      >
        {LEADER_RULE}
      </span>
    </Component>
  );
};

export type { LeaderProps };
export { LEADER_RULE, Leader };
