/*
 * SiteFooter — server component.
 *
 * Copyright line, ASCII tagline, and the social links rendered as ghost
 * buttons over the shared Button primitive.
 */

import { Button } from "@repo/shared/ui/button";

import { CONTENT_REVISION, SITE_VERSION } from "./site.ts";

import styles from "./site-footer.module.css";

const SOCIAL_LINKS = [
  { href: "https://www.linkedin.com/in/mimshins/", label: "linkedin" },
  { href: "https://github.com/mimshins", label: "github" },
  { href: "https://twitter.com/mimshins", label: "twitter" },
] as const;

const SiteFooter = () => (
  <footer
    className={styles.footer}
    data-slot="site-footer"
  >
    <div
      className={styles.inner}
      data-slot="site-footer-inner"
    >
      <span className={styles.copy}>
        &copy; {new Date().getFullYear()} &middot; sudo-overclock &middot;{" "}
        <span
          className={styles.version}
          data-slot="site-version"
        >
          v{SITE_VERSION} &middot; {CONTENT_REVISION}
        </span>
      </span>
      <span className={styles.ascii}>&mdash; built with phosphor &mdash;</span>
      <nav
        className={styles.socials}
        aria-label="social"
        data-slot="site-socials"
      >
        {SOCIAL_LINKS.map(social => (
          <Button
            key={social.label}
            as="a"
            variant="ghost"
            color="neutral"
            size="sm"
            href={social.href}
            target="_blank"
            rel="me noreferrer"
          >
            [ {social.label} ]
          </Button>
        ))}
      </nav>
    </div>
  </footer>
);

export { SiteFooter };
