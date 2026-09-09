/*
 * Reading list — app-owned content for the /reading page.
 * Covers live in public/reading/<cover>.jpg; reviews are short first-person
 * notes on why the book mattered.
 */

type Book = {
  readonly title: string;
  readonly authors: string;
  readonly cover: string;
  readonly review: string;
};

const NOW_READING: readonly Book[] = [
  {
    title: "Understanding Distributed Systems",
    authors: "Roberto Vitillo",
    cover: "understanding-distributed-systems",
    review:
      "A clear, practical on-ramp to distributed systems — communication, scaling, resilience, and consistency built into a mental model I reach for daily.",
  },
  {
    title: "Designing Data-Intensive Applications",
    authors: "Martin Kleppmann",
    cover: "designing-data-intensive-applications",
    review:
      "The canonical deep dive into reliable, scalable, maintainable data systems — storage engines, replication, partitioning, transactions, and the trade-offs behind them. Reading it alongside my day job makes the theory land.",
  },
];

const READ: readonly Book[] = [
  {
    title: "Learning Go",
    authors: "Jon Bodner",
    cover: "learning-go",
    review:
      "The book I learned Go from. Beyond the syntax it teaches idiomatic Go — modern tooling, error handling, and concurrency — so the code reads the way the community expects it to.",
  },
  {
    title: "Concurrency in Go",
    authors: "Katherine Cox-Buday",
    cover: "concurrency-in-go",
    review:
      "Made goroutines and channels click. It builds the mental model first, then the real patterns — pipelines, cancellation, error propagation, context — for writing safe, composable concurrent programs.",
  },
];

export type { Book };
export { NOW_READING, READ };
