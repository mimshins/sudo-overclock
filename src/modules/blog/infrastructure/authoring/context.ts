/*
 * Authoring paths.
 *
 * Resolves the directories the authoring CLI touches: the draft workspace, the
 * published raw content, the Next.js public directory, and the `.ai/templates/`
 * starting points. Kept in one place so scripts and tests agree.
 */

import { resolve } from "node:path";

type AuthoringContext = {
  /** Absolute path to the repository root. */
  readonly projectRoot: string;
  /** Absolute path to `modules/blog/content/drafts/`. */
  readonly draftsDir: string;
  /** Absolute path to `modules/blog/content/raw/`. */
  readonly rawDir: string;
  /** Absolute path to `modules/blog/content/compiled/`. */
  readonly compiledDir: string;
  /** Absolute path to the Next.js `public/` directory. */
  readonly publicDir: string;
  /** Absolute path to `.ai/templates/`. */
  readonly templatesDir: string;
};

const createAuthoringContext = (projectRoot: string): AuthoringContext => ({
  projectRoot,
  draftsDir: resolve(projectRoot, "src/modules/blog/content/drafts"),
  rawDir: resolve(projectRoot, "src/modules/blog/content/raw"),
  compiledDir: resolve(projectRoot, "src/modules/blog/content/compiled"),
  publicDir: resolve(projectRoot, "public"),
  templatesDir: resolve(projectRoot, ".ai/templates"),
});

export { createAuthoringContext };
export type { AuthoringContext };
