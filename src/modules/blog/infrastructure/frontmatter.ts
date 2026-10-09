/*
 * Frontmatter — split and join the YAML front matter of a markdown source.
 *
 * The block opens with `---` on the first line and closes at the next line that
 * is exactly `---`. YAML is parsed with the 1.2 core schema, so unquoted dates
 * stay strings. Shared by the compiler and the authoring CLI (ADR-017).
 */

import { parse, stringify } from "yaml";

type FrontmatterData = Readonly<Record<string, unknown>>;

type Frontmatter = {
  readonly data: FrontmatterData;
  readonly content: string;
};

const BLOCK = /^---[ \t]*\r?\n(?<yaml>[\s\S]*?)^---[ \t]*(?:\r?\n|$)/mu;

const isMapping = (value: unknown): value is FrontmatterData =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseFrontmatter = (source: string): Frontmatter => {
  const match = BLOCK.exec(source);

  if (match?.index !== 0) {
    return { data: {}, content: source };
  }

  const value: unknown = parse(match.groups?.["yaml"] ?? "");
  const content = source.slice(match[0].length);

  if (value === null || value === undefined) {
    return { data: {}, content };
  }

  if (!isMapping(value)) {
    throw new Error("Front matter must be a YAML mapping.");
  }

  return { data: value, content };
};

const stringifyFrontmatter = (
  content: string,
  data: FrontmatterData,
): string => {
  const body = content.endsWith("\n") ? content : `${content}\n`;

  if (Object.keys(data).length === 0) {
    return body;
  }

  return `---\n${stringify(data).trimEnd()}\n---\n${body}`;
};

export type { Frontmatter, FrontmatterData };
export { parseFrontmatter, stringifyFrontmatter };
