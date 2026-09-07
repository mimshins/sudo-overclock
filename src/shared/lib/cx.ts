import { clsx, type ClassValue } from "clsx";

/**
 * `cx` — className composer.
 *
 * Thin wrapper around `clsx`. Accepts strings, undefined, false, null, and
 * arrays of those. Returns a single space-separated string.
 *
 * CSS Module imports return `string | undefined` per key because of
 * `noUncheckedIndexedAccess`. `cx` accepts that directly — never write
 * `styles.foo ?? ""` before passing it in.
 *
 * Lookup maps should type their value as `ClassValue` so the table type- checks
 * without defensive nullish-coalescing:
 *
 * ```ts
 * const sizeClass: Record<Size, ClassValue> = {
 *   sm: styles.sizeSm,
 *   md: styles.sizeMd,
 *   lg: styles.sizeLg,
 * };
 *
 * cx(styles.root, sizeClass[size], className);
 * ```
 */
const cx = (...inputs: ClassValue[]): string => clsx(...inputs);

export { cx };
export type { ClassValue };
