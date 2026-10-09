import { cx } from "@repo/shared/lib/cx";
import { Heading } from "@repo/shared/ui/heading";
import { Leader } from "@repo/shared/ui/leader";

import { LinkButton } from "./link-button.tsx";

import styles from "./not-found.module.css";

export const metadata = {
  title: "404 — sudo-overclock",
  description: "Page not found.",
};

const ART = [
  "██╗  ██╗ ██████╗ ██╗  ██╗",
  "██║  ██║██╔═████╗██║  ██║",
  "███████║██║██╔██║███████║",
  "╚════██║████╔╝██║╚════██║",
  "     ██║╚██████╔╝     ██║",
  "     ╚═╝ ╚═════╝      ╚═╝",
].join("\n");

const NotFound = () => (
  <main
    id="main"
    className={cx(styles.main, "scanlines")}
    data-slot="not-found"
  >
    <Leader>404.log</Leader>
    <Heading
      as="h1"
      size="h1"
      glow
      className={cx(styles.title, "glitch-once")}
    >
      not found
    </Heading>
    <div
      className={styles.body}
      data-slot="not-found-body"
    >
      <div
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- ASCII art stays text in a <pre>; role="img" gives it one accessible name
        role="img"
        aria-label="404"
        className={styles.art}
        data-slot="not-found-art"
      >
        <pre
          className={cx(styles.artText, "phosphor-glow")}
          data-slot="not-found-art-text"
        >
          {ART}
        </pre>
      </div>
      <div
        className={styles.terminal}
        data-slot="not-found-terminal"
      >
        <p
          className={styles.line}
          data-slot="not-found-line"
        >
          <span
            className={styles.prompt}
            data-slot="not-found-prompt"
            aria-hidden="true"
          >
            {"$ "}
          </span>
          cd ./this-page
        </p>
        <p
          className={styles.line}
          data-slot="not-found-line"
        >
          cd: ./this-page: no such file or directory
        </p>
        <p
          className={cx(styles.line, styles.hint)}
          data-slot="not-found-line"
        >
          it moved, was never written, or got lost in transmission.
        </p>
      </div>
      <div
        className={styles.actions}
        data-slot="not-found-actions"
      >
        <LinkButton
          href="/"
          variant="ghost"
          color="phosphor"
          size="md"
        >
          [ home ]
        </LinkButton>
        <LinkButton
          href="/blog/"
          variant="ghost"
          color="phosphor"
          size="md"
        >
          [ read the blog ]
        </LinkButton>
      </div>
    </div>
  </main>
);

export default NotFound;
