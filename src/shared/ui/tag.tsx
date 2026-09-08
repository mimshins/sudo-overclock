import { cx } from "@repo/shared/lib/cx";
import type { MouseEventHandler, ReactNode } from "react";

import styles from "./tag.module.css";

type TagProps = {
  readonly active?: boolean;
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
  readonly className?: string;
  readonly children: ReactNode;
};

const Tag = ({ active = false, onClick, className, children }: TagProps) => {
  const classes = cx(styles.tag, active && styles.active, className);

  if (onClick !== undefined) {
    return (
      <button type="button" onClick={onClick} className={classes} data-slot="tag">
        {children}
      </button>
    );
  }

  return (
    <span className={classes} data-slot="tag">
      {children}
    </span>
  );
};

export type { TagProps };
export { Tag };
