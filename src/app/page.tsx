import { Heading } from "@repo/shared/ui/heading";
import { Leader } from "@repo/shared/ui/leader";
import { PhosphorField } from "@repo/shared/ui/phosphor-field";

import { LinkButton } from "./link-button.tsx";
import { pageMetadata } from "./metadata.ts";
import { PAGES } from "./pages.ts";

import styles from "./page.module.css";

export const metadata = pageMetadata(PAGES.home);

const HomePage = () => (
  <main
    id="main"
    className={`${styles.main} noise`}
    data-slot="home"
  >
    <PhosphorField />
    <Leader>{PAGES.home.leader}</Leader>
    <Heading
      as="h1"
      size="h1"
      glow
      className={styles.title}
    >
      sudo-overclock
    </Heading>
    <p
      className={styles.subtitle}
      data-slot="home-subtitle"
    >
      $ cat /dev/brain &gt; engineering.log &amp;&amp; ./sudo-overclock --ship
    </p>
    <div
      className={styles.actions}
      data-slot="home-actions"
    >
      <LinkButton
        href="/blog/"
        variant="soft"
        color="phosphor"
        size="md"
      >
        [ read the blog ]
      </LinkButton>
      <LinkButton
        href="/about/"
        variant="soft"
        color="phosphor"
        size="md"
      >
        [ who am i ]
      </LinkButton>
    </div>
  </main>
);

export default HomePage;
