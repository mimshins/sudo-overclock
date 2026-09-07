/*
 * ## Polymorphic component utilities
 *
 * These types let a component declare a polymorphic `as` prop while preserving
 * the full prop surface (including `ref`) of the underlying element.
 *
 * Inspired by Radix UI / react-polymorphic-box conventions. Kept tiny — no
 * runtime cost, no extra dependencies.
 *
 * Usage:
 *
 * type ButtonProps<T extends ElementType = "button"> = PolymorphicProps<T, {
 * variant?: Variant; size?: Size; }>;
 */

import type {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ElementType,
  ReactNode,
  Ref,
} from "react";

/** Props that we always want to allow regardless of the rendered element. */
type AsProp = {
  readonly as?: ElementType;
  readonly children?: ReactNode;
};

/**
 * Merge our component-specific props with the target element's own props.
 * `Omit<…, keyof OwnProps & keyof ComponentPropsWithoutRef<T>>` prevents the
 * two surfaces from colliding (e.g. `children` / `className` / `style`).
 */
type PolymorphicProps<T extends ElementType, OwnProps> = OwnProps &
  AsProp &
  Omit<ComponentPropsWithoutRef<T>, keyof OwnProps | keyof AsProp> & {
    readonly ref?: Ref<
      ComponentPropsWithRef<T>["ref"] extends Ref<infer U> ? U : never
    >;
  };

/**
 * Resolve the element type. If `as` is provided we use it; otherwise fall back
 * to the supplied `Default`.
 */
type PolymorphicRender<
  T extends ElementType,
  Default extends ElementType,
> = T extends ElementType ? T : Default;

export type {
  AsProp,
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ElementType,
  PolymorphicProps,
  PolymorphicRender,
  Ref,
};
