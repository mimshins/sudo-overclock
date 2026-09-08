import { Heading } from "@repo/shared/ui/heading";

import styles from "./reading.module.css";

export const metadata = {
  title: "reading — sudo-overclock",
  description: "What @mimshins is reading.",
};

const ReadingPage = () => (
  <main className={styles.main} data-slot="reading">
    <div className={styles.leader} data-slot="leader">
      <span className={styles.leaderDash}>&mdash;&mdash;</span>
      <span className={styles.leaderText}>reading.md</span>
      <span className={styles.leaderDash}>&mdash;&mdash;</span>
    </div>
    <Heading as="h1" size="h1" glow className={styles.title}>
      reading
    </Heading>
    <p className={styles.note}>reading list &mdash; coming soon</p>
  </main>
);

export default ReadingPage;
