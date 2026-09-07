import { PostList } from "@repo/modules/blog/presentation/post-list";
import { Button } from "@repo/shared/ui/button";
import { Heading } from "@repo/shared/ui/heading";

import styles from "./page.module.css";

const HomePage = () => (
  <main
    className={`${styles.main} noise`}
    data-slot="home"
  >
    <div
      className={styles.leader}
      data-slot="leader"
    >
      <span className={styles.leaderDash}>&mdash;&mdash;</span>
      <span className={styles.leaderText}>home.sh</span>
      <span className={styles.leaderDash}>&mdash;&mdash;</span>
    </div>
    <Heading
      as="h1"
      size="h1"
      glow
      className={styles.title}
    >
      sudo-overclock
    </Heading>
    <p className={styles.subtitle}>engineering.log &mdash; coming online</p>
    <Button
      variant="phosphor"
      size="md"
      aria-label="read more"
    >
      [ read more ]
    </Button>
    <section
      className={styles.postsSection}
      data-slot="posts"
    >
      <Heading
        as="h2"
        size="h4"
        variant="muted"
        className={styles.postsTitle}
      >
        &mdash; posts &mdash;
      </Heading>
      <PostList emptyMessage="no posts yet &mdash; compiler pipeline lands in phase 2" />
    </section>
  </main>
);

export default HomePage;
