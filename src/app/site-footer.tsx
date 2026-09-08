import { Button } from "@repo/shared/ui/button";

import styles from "./site-footer.module.css";

const SOCIAL_LINKS = [
  { href: "https://www.linkedin.com/in/mimshins/", label: "linkedin" },
  { href: "https://github.com/mimshins", label: "github" },
  { href: "https://twitter.com/mimshins", label: "twitter" },
] as const;

const SiteFooter = () => (
  <footer className={styles.footer} data-slot="site-footer">
    <div className={styles.inner} data-slot="site-footer-inner">
      <span className={styles.copy}>
        &copy; {new Date().getFullYear()} &middot; sudo-overclock
      </span>
      <span className={styles.ascii}>&mdash; built with phosphor &mdash;</span>
      <nav
        className={styles.socials}
        aria-label="social"
        data-slot="site-socials"
      >
        {SOCIAL_LINKS.map((social) => (
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
