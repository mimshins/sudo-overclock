import styles from "./site-footer.module.css";

const SiteFooter = () => (
  <footer className={styles.footer} data-slot="site-footer">
    <span className={styles.copy}>
      &copy; {new Date().getFullYear()} &middot; sudo-overclock
    </span>
    <span className={styles.ascii}>&mdash; built with phosphor &mdash;</span>
  </footer>
);

export { SiteFooter };
