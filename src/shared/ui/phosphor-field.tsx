"use client";

/*
 * PhosphorField — client component.
 *
 * Renders the phosphor dot field described in `phosphor-field-session.ts`.
 * No `src` keeps the procedural home-page look; passing a `src` turns the
 * field into a pointillist sampling of that photo (blog page). Set
 * `glowOnHover` to false to render the field statically without the pointer
 * light-up.
 */

import { cx } from "@repo/shared/lib/cx";
import { useEffect, useRef } from "react";

import { PhosphorSession } from "./phosphor-field-session.ts";

import styles from "./phosphor-field.module.css";

type PhosphorFieldProps = {
  readonly src?: string;
  readonly className?: string;
  /** Light dots toward phosphor as the pointer approaches (default on). */
  readonly glowOnHover?: boolean;
};

const PhosphorField = ({
  src,
  className,
  glowOnHover = true,
}: PhosphorFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    let session: PhosphorSession | null = null;
    if (canvas !== null) {
      try {
        session = new PhosphorSession(canvas, src ?? null, glowOnHover);
      } catch {
        session = null;
      }
    }

    if (session !== null) session.start();

    return () => {
      if (session !== null) session.stop();
    };
  }, [src, glowOnHover]);

  return (
    <canvas
      ref={canvasRef}
      className={cx(styles.field, className)}
      aria-hidden="true"
      data-slot="phosphor-field"
    />
  );
};

export type { PhosphorFieldProps };
export { PhosphorField };
