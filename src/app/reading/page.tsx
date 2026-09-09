import { Heading } from "@repo/shared/ui/heading";
import { PhosphorField } from "@repo/shared/ui/phosphor-field";

import { NOW_READING, READ, type Book } from "./books.ts";
import { CoverImage } from "./cover-image.tsx";

import styles from "./reading.module.css";

export const metadata = {
  title: "reading — sudo-overclock",
  description: "Technical books on the desk of @mimshins.",
};

const initials = (title: string): string =>
  title
    .split(/\s+/u)
    .filter(word => /[A-Za-z0-9]/u.test(word))
    .slice(0, 3)
    .map(word => word.charAt(0).toUpperCase())
    .join("");

const SectionHead = ({ label }: { readonly label: string }) => (
  <h2
    className={styles.sectionHead}
    data-slot="reading-section-head"
  >
    <span className={styles.sectionDash}>&mdash;&mdash;</span>
    <span className={styles.sectionLabel}>{label}</span>
    <span className={styles.sectionDash}>&mdash;&mdash;</span>
  </h2>
);

const BookRow = ({ book }: { readonly book: Book }) => (
  <li
    className={styles.book}
    data-slot="reading-book"
  >
    <div className={styles.coverFrame}>
      <span
        className={styles.coverFallback}
        aria-hidden="true"
      >
        {initials(book.title)}
      </span>
      <CoverImage
        src={`/reading/${book.cover}.jpg`}
        alt={`${book.title} cover`}
        className={styles.cover}
      />
    </div>
    <div
      className={styles.bookBody}
      data-slot="reading-book-body"
    >
      <h3 className={styles.bookTitle}>{book.title}</h3>
      <p className={styles.bookAuthors}>{book.authors}</p>
      <p className={styles.review}>{book.review}</p>
    </div>
  </li>
);

const BookSection = ({
  label,
  books,
}: {
  readonly label: string;
  readonly books: readonly Book[];
}) => (
  <section
    className={styles.section}
    data-slot="reading-section"
  >
    <SectionHead label={label} />
    <ul
      className={styles.books}
      data-slot="reading-books"
    >
      {books.map(book => (
        <BookRow
          key={book.cover}
          book={book}
        />
      ))}
    </ul>
  </section>
);

const ReadingPage = () => (
  <main
    id="main"
    className={`${styles.main} noise`}
    data-slot="reading"
  >
    <PhosphorField
      src="/reading/bg.jpg"
      glowOnHover={false}
    />
    <div
      className={styles.leader}
      data-slot="leader"
    >
      <span className={styles.leaderDash}>&mdash;&mdash;</span>
      <span className={styles.leaderText}>reading.md</span>
      <span className={styles.leaderDash}>&mdash;&mdash;</span>
    </div>
    <Heading
      as="h1"
      size="h1"
      glow
      className={styles.title}
    >
      reading
    </Heading>
    <div
      className={styles.body}
      data-slot="reading-body"
    >
      <BookSection
        label="now reading"
        books={NOW_READING}
      />
      <BookSection
        label="read"
        books={READ}
      />
    </div>
  </main>
);

export default ReadingPage;
