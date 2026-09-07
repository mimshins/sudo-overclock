import { Button } from "@repo/shared/ui/button";
import { Heading } from "@repo/shared/ui/heading";
import Link from "next/link";

import styles from "./page.module.css";

const HomePage = () => (
  <main className={`${styles.main} noise`} data-slot="home">
    <div className={styles.leader} data-slot="leader">
      <span className={styles.leaderDash}>&mdash;&mdash;</span>
      <span className={styles.leaderText}>home.sh</span>
      <span className={styles.leaderDash}>&mdash;&mdash;</span>
    </div>
    <Heading as="h1" size="h1" glow className={styles.title}>
      sudo-overclock
    </Heading>
    <p className={styles.subtitle}>engineering.log &mdash; coming online</p>
    <Link href="/blog/">
      <Button variant="phosphor" size="md" aria-label="read more">
        [ read the blog ]
      </Button>
    </Link>
  </main>
);

export default HomePage;
