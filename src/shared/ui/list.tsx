import { cx } from "@repo/shared/lib/cx";
import type { PolymorphicProps } from "@repo/shared/lib/polymorphic";
import type { ElementType } from "react";

import styles from "./list.module.css";

type ListOwnProps = {
  readonly ordered?: boolean;
  readonly tight?: boolean;
};

type ListProps<T extends ElementType = "ul"> = PolymorphicProps<
  T,
  ListOwnProps
>;

const List = <T extends ElementType = "ul">({
  as,
  ordered = false,
  tight = false,
  className,
  children,
  ...rest
}: ListProps<T>) => {
  const Component = as ?? (ordered ? "ol" : "ul");
  return (
    <Component
      className={cx(styles.list, tight && styles.tight, className)}
      {...rest}
      data-slot="list"
    >
      {children}
    </Component>
  );
};

type ListItemOwnProps = Record<never, never>;

type ListItemProps<T extends ElementType = "li"> = PolymorphicProps<
  T,
  ListItemOwnProps
>;

const ListItem = <T extends ElementType = "li">({
  as,
  className,
  children,
  ...rest
}: ListItemProps<T>) => {
  const Component = as ?? "li";

  return (
    <Component
      className={cx(styles.item, className)}
      {...rest}
      data-slot="list-item"
    >
      {children}
    </Component>
  );
};

export type { ListProps, ListItemProps };
export { List, ListItem };
