"use client";

import { cx } from "@repo/shared/lib/cx";
import { Button } from "@repo/shared/ui/button";
import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  applyTheme,
  currentTheme,
  PREFERS_LIGHT,
  serverTheme,
  storedTheme,
  storeTheme,
  subscribeTheme,
} from "./theme.ts";

import styles from "./theme-toggle.module.css";

type ThemeToggleProps = {
  readonly className?: string;
};

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, serverTheme);

  useEffect(() => {
    const media = window.matchMedia(PREFERS_LIGHT);
    const followSystem = (
      event: Pick<MediaQueryListEvent, "matches">,
    ): void => {
      if (storedTheme() === null) {
        applyTheme(event.matches ? "light" : "dark");
      }
    };

    media.addEventListener("change", followSystem);

    return () => {
      media.removeEventListener("change", followSystem);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = currentTheme() === "light" ? "dark" : "light";

    applyTheme(next);
    storeTheme(next);
  }, []);

  return (
    <Button
      variant="ghost"
      color="neutral"
      size="sm"
      className={cx(styles.toggle, className)}
      aria-pressed={theme === "light"}
      onClick={toggle}
    >
      [ light ]
    </Button>
  );
};

export { ThemeToggle };
