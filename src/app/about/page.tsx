import { Heading } from "@repo/shared/ui/heading";
import { PhosphorField } from "@repo/shared/ui/phosphor-field";

import styles from "./about.module.css";

export const metadata = {
  title: "about — sudo-overclock",
  description: "About Mostafa Shamsitabar.",
};

type HistoryEntry = {
  readonly period: string;
  readonly role: string;
  readonly company: string;
};

const HISTORY: readonly HistoryEntry[] = [
  {
    period: "feb 2026 — sep 2026",
    role: "senior software engineer · growth engine",
    company: "tapsi",
  },
  {
    period: "sep 2024 — feb 2026",
    role: "senior software engineer · client foundation & devexp",
    company: "tapsi",
  },
  {
    period: "jun 2019 — may 2024",
    role: "senior front-end engineer",
    company: "divar",
  },
];

const SectionHead = ({ label }: { readonly label: string }) => (
  <h2
    className={styles.blockHead}
    data-slot="about-section-head"
  >
    <span className={styles.blockDash}>&mdash;&mdash;</span>
    <span className={styles.blockLabel}>{label}</span>
    <span className={styles.blockDash}>&mdash;&mdash;</span>
  </h2>
);

const WhoAmI = () => (
  <section
    className={styles.panel}
    data-slot="about-whoami"
  >
    <h2 className={styles.name}>Mostafa Shamsitabar</h2>
    <p className={styles.role}>platform &amp; software engineer</p>
    <p className={styles.keywords}>engineering productivity</p>
    <p className={styles.blurb}>
      highly accomplished and results-driven lead/senior engineer with
      sre/platform engineer mindset and a proven track record in architecting,
      building, and scaling complex platforms and user-facing products.
    </p>
  </section>
);

const Now = () => (
  <section
    className={styles.panel}
    data-slot="about-now"
  >
    <SectionHead label="now" />
    <p className={styles.current}>
      founding engineer
      <span className={styles.accent}> @ interaverse</span>
    </p>
    <p className={styles.since}>since sep 2026</p>
  </section>
);

const History = () => (
  <section
    className={styles.panel}
    data-slot="about-history"
  >
    <SectionHead label="history" />
    <ul
      className={styles.history}
      data-slot="about-history-list"
    >
      {HISTORY.map(entry => (
        <li
          key={`${entry.company}-${entry.period}`}
          className={styles.entry}
          data-slot="about-history-entry"
        >
          <span className={styles.period}>{entry.period}</span>
          <span className={styles.entryRole}>
            {entry.role}
            <span className={styles.accent}> @ {entry.company}</span>
          </span>
        </li>
      ))}
    </ul>
  </section>
);

const AboutPage = () => (
  <main
    className={`${styles.main} noise`}
    data-slot="about"
  >
    <PhosphorField
      src="/about/bg.png"
      glowOnHover={false}
    />
    <div
      className={styles.leader}
      data-slot="leader"
    >
      <span className={styles.leaderDash}>&mdash;&mdash;</span>
      <span className={styles.leaderText}>about.md</span>
      <span className={styles.leaderDash}>&mdash;&mdash;</span>
    </div>
    <Heading
      as="h1"
      size="h1"
      glow
      className={styles.title}
    >
      about
    </Heading>
    <div
      className={styles.body}
      data-slot="about-body"
    >
      <WhoAmI />
      <Now />
      <History />
    </div>
  </main>
);

export default AboutPage;
