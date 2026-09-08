"use client";

import { cx } from "@repo/shared/lib/cx";
import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./site-header.module.css";

const NAV_LINKS = [
  { href: "/", label: "home" },
  { href: "/blog/", label: "blog" },
  { href: "/about/", label: "about" },
  { href: "/reading/", label: "reading" },
] as const;

const isActive = (pathname: string, href: string): boolean =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

const SiteHeader = () => {
  const pathname = usePathname();

  return (
    <header className={styles.header} data-slot="site-header">
      <div className={styles.inner} data-slot="site-header-inner">
        <Link href="/" className={styles.brand}>
          sudo-overclock
        </Link>
        <nav className={styles.nav} aria-label="primary" data-slot="site-nav">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cx(styles.link, active && styles.active)}
              >
                [ {link.label} ]
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export { SiteHeader };
