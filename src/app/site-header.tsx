"use client";

/*
 * SiteHeader — client component.
 *
 * Brand, primary nav, and the small-screen menu. Active state comes from the
 * current pathname; the menu closes on navigation and on Escape, returning
 * focus to the toggle button.
 */

import { cx } from "@repo/shared/lib/cx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./site-header.module.css";

const NAV_LINKS = [
  { href: "/", label: "home" },
  { href: "/blog/", label: "blog" },
  { href: "/about/", label: "about" },
  { href: "/reading/", label: "reading" },
] as const;

const isActive = (pathname: string, href: string): boolean =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

type NavLinksProps = {
  readonly pathname: string;
  readonly onNavigate: () => void;
};

const NavLinks = ({ pathname, onNavigate }: NavLinksProps) => (
  <>
    {NAV_LINKS.map(link => {
      const active = isActive(pathname, link.href);
      return (
        <Link
          key={link.href}
          href={link.href}
          aria-current={active ? "page" : undefined}
          className={cx(styles.link, active && styles.active)}
          onClick={onNavigate}
        >
          [ {link.label} ]
        </Link>
      );
    })}
  </>
);

type MenuButtonProps = {
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly onClose: () => void;
};

const MenuButton = ({ open, onToggle, onClose }: MenuButtonProps) => {
  const button = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
        button.current?.focus();
      }
    };
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <button
      ref={button}
      type="button"
      className={cx(styles.menuButton, open && styles.menuButtonOpen)}
      aria-expanded={open}
      aria-controls="site-nav"
      aria-label={open ? "close menu" : "open menu"}
      onClick={onToggle}
    >
      <span
        className={styles.burgerBar}
        aria-hidden="true"
      />
    </button>
  );
};

const SiteHeader = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const toggle = useCallback((): void => {
    setOpen(value => !value);
  }, []);
  const close = useCallback((): void => {
    setOpen(false);
  }, []);

  return (
    <header
      className={styles.header}
      data-slot="site-header"
    >
      <div
        className={styles.inner}
        data-slot="site-header-inner"
      >
        <Link
          href="/"
          className={styles.brand}
        >
          <span
            className={styles.brandPrompt}
            aria-hidden="true"
          >
            &gt;
          </span>
          sudo-overclock
        </Link>
        <MenuButton
          open={open}
          onToggle={toggle}
          onClose={close}
        />
        <nav
          id="site-nav"
          className={cx(styles.nav, open && styles.navOpen)}
          aria-label="primary"
          data-slot="site-nav"
        >
          <NavLinks
            pathname={pathname}
            onNavigate={close}
          />
        </nav>
      </div>
    </header>
  );
};

export { SiteHeader };
