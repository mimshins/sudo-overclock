import Link from "next/link";

import styles from "./site-header.module.css";

const NAV_LINKS = [
  { href: "/", label: "home" },
  { href: "/blog/", label: "blog" },
  { href: "/about/", label: "about" },
  { href: "/reading/", label: "reading" },
] as const;

const SiteHeader = () => (
  <header className={styles.header} data-slot="site-header">
    <Link href="/" className={styles.brand}>
      sudo-overclock
    </Link>
    <nav className={styles.nav} aria-label="primary" data-slot="site-nav">
      {NAV_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className={styles.link}>
          [ {link.label} ]
        </Link>
      ))}
    </nav>
  </header>
);

export { SiteHeader };
