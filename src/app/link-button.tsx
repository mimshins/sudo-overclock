"use client";

/*
 * LinkButton — client component.
 *
 * A Button that navigates with the Next router instead of a full page load.
 * `next/link` cannot be passed as `as` from a Server Component (functions
 * can't cross the RSC boundary), so this thin client wrapper owns the Link.
 */

import {
  Button,
  type Color,
  type Size,
  type Variant,
} from "@repo/shared/ui/button";
import Link from "next/link";
import type { ReactNode } from "react";

type LinkButtonProps = {
  readonly href: string;
  readonly variant?: Variant;
  readonly color?: Color;
  readonly size?: Size;
  readonly ariaLabel?: string;
  readonly className?: string;
  readonly children: ReactNode;
};

const LinkButton = ({
  href,
  variant,
  color,
  size,
  ariaLabel,
  className,
  children,
}: LinkButtonProps) => (
  <Button
    as={Link}
    href={href}
    variant={variant}
    color={color}
    size={size}
    aria-label={ariaLabel}
    className={className}
  >
    {children}
  </Button>
);

export type { LinkButtonProps };
export { LinkButton };
