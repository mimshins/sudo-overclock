import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "../../..");
const SRC = join(ROOT, "src");

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);

    return entry.isDirectory() ? walk(path) : [path];
  });

const files = walk(SRC);
const rel = (path: string): string => relative(ROOT, path);

const stripComments = (css: string): string =>
  css.replaceAll(/\/\*[\s\S]*?\*\//gu, "");

const matchesOf = (text: string, pattern: RegExp): Set<string> =>
  new Set(Array.from(text.matchAll(pattern), match => match[1] ?? ""));

const globalProperties = matchesOf(
  stripComments(readFileSync(join(SRC, "app/globals.css"), "utf8")),
  /(--[\w-]+)\s*:/gu,
);

const cssModules = files.filter(path => path.endsWith(".module.css"));

const readAnywhere = matchesOf(
  [...cssModules, join(SRC, "app/globals.css")]
    .map(path => stripComments(readFileSync(path, "utf8")))
    .join("\n"),
  /var\(\s*(--[\w-]+)/gu,
);

const unreadLocalProperties = (path: string): string[] => {
  const css = stripComments(readFileSync(path, "utf8"));
  const set = matchesOf(css, /(--[\w-]+)\s*:/gu);

  return [...set]
    .filter(name => !globalProperties.has(name) && !readAnywhere.has(name))
    .map(name => `${rel(path)} ${name}`);
};

const classesOf = (path: string): Set<string> =>
  matchesOf(
    stripComments(readFileSync(path, "utf8")),
    /(?<![\w-])\.([A-Za-z_][\w-]*)/gu,
  );

const missingClasses = (componentPath: string): string[] => {
  const source = readFileSync(componentPath, "utf8");
  const imported = /import\s+styles\s+from\s+"(\.\/[^"]+\.module\.css)"/u.exec(
    source,
  );

  if (imported?.[1] === undefined) {
    return [];
  }

  const classes = classesOf(resolve(dirname(componentPath), imported[1]));
  const referenced = matchesOf(source, /\bstyles\.(\w+)/gu);

  return [...referenced]
    .filter(name => !classes.has(name))
    .map(name => `${rel(componentPath)} styles.${name}`);
};

describe("CSS module contract", () => {
  it("reads every custom property a module sets somewhere", () => {
    const unread = cssModules.flatMap(path => unreadLocalProperties(path));

    expect(unread).toEqual([]);
  });

  it("defines every class a component references on its module", () => {
    const missing = files
      .filter(path => path.endsWith(".tsx") && !path.endsWith(".test.tsx"))
      .flatMap(path => missingClasses(path));

    expect(missing).toEqual([]);
  });
});
