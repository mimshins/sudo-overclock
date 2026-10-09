"use client";

/*
 * PhosphorField — client component.
 *
 * Renders the phosphor dot field described in `phosphor-field-session.ts`.
 * No `src` keeps the procedural home-page look; passing a `src` turns the
 * field into a pointillist sampling of that photo (blog page). Set
 * `glowOnHover` to false to render the field statically without the pointer
 * light-up. The `src` is preloaded from the document head so the photo is
 * usually decoded by the time the canvas mounts.
 */

import { cx } from "@repo/shared/lib/cx";
import { PhosphorSession } from "@repo/shared/ui/phosphor-field-session";
import { useEffect, useRef } from "react";
import { preload } from "react-dom";

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

  if (src !== undefined) preload(src, { as: "image" });

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

    const themeObserver = new MutationObserver(() => {
      session?.refreshColors();
    });

    if (session !== null) {
      session.start();
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    }

    return () => {
      themeObserver.disconnect();
      session?.stop();
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
