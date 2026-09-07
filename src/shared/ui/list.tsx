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
      data-slot="list"
      {...rest}
    >
      {children}
    </Component>
  );
};

type ListItemOwnProps = Record<string, never>;

type ListItemProps<T extends ElementType = "li"> = PolymorphicProps<
  T,
  ListItemOwnProps
>;

const ListItem = <T extends ElementType = "li">({
  className,
  children,
  ...rest
}: ListItemProps<T>) => {
  const Component = "li";

  return (
    <Component
      className={cx(styles.item, className)}
      data-slot="list-item"
      {...rest}
    >
      {children}
    </Component>
  );
};

export type { ListProps, ListItemProps };
export { List, ListItem };
