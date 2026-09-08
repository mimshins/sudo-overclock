import { Heading } from "@repo/shared/ui/heading";

import styles from "./about.module.css";

export const metadata = {
  title: "about — sudo-overclock",
  description: "About @mimshins.",
};

const AboutPage = () => (
  <main className={styles.main} data-slot="about">
    <div className={styles.leader} data-slot="leader">
      <span className={styles.leaderDash}>&mdash;&mdash;</span>
      <span className={styles.leaderText}>about.md</span>
      <span className={styles.leaderDash}>&mdash;&mdash;</span>
    </div>
    <Heading as="h1" size="h1" glow className={styles.title}>
      about
    </Heading>
    <p className={styles.note}>bio &amp; resume &mdash; coming soon</p>
  </main>
);

export default AboutPage;
