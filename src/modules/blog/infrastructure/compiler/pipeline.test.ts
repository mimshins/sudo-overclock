import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createMarkdownCompiler } from "./pipeline.ts";
import { getHighlighter } from "./shiki.ts";

const highlighter = await getHighlighter();

const compile = createMarkdownCompiler({
  highlighter,
  assets: { postDir: process.cwd(), slug: "test", publicDir: "/tmp" },
});

const html = async (markdown: string): Promise<string> =>
  (await compile(markdown)).html;

describe("markdown pipeline", () => {
  it("renders headings and paragraphs to HTML", async () => {
    const output = await html("# Hello\n\nWorld.");
    assert.match(output, /<h1 id="hello">/u);
    assert.match(output, /Hello<\/h1>/u);
    assert.match(output, /<p>World\.<\/p>/u);
  });

  it("renders GFM tables", async () => {
    const output = await html("| a | b |\n| - | - |\n| 1 | 2 |");
    assert.match(output, /<table>/u);
    assert.match(output, /<th>a<\/th>/u);
  });

  it("highlights fenced code blocks with the Shiki theme", async () => {
    const output = await html("```ts\nconst x: number = 1;\n```");
    assert.match(output, /class="shiki/u);
    assert.match(output, /var\(--shiki-token-keyword\)/u);
  });

  it("keeps plain fenced blocks as plain pre/code", async () => {
    const output = await html("```\nno language\n```");
    assert.match(output, /<pre><code>no language/u);
  });

  it("renders inline code", async () => {
    const output = await html("use `npm install` now");
    assert.match(output, /<code>npm install<\/code>/u);
  });
});

describe("leading title heading stripping", () => {
  const titleCompiler = createMarkdownCompiler({
    highlighter,
    assets: { postDir: process.cwd(), slug: "test", publicDir: "/tmp" },
    stripTitleHeading: true,
  });

  it("drops a redundant leading h1 and keeps it out of the toc", async () => {
    const { html: output, toc } = await titleCompiler(
      "# Hello, Overclock\n\n## Intro\n\nSome body.",
    );
    assert.doesNotMatch(output, /<h1/u);
    assert.match(output, /<h2 id="intro">/u);
    assert.match(output, /Intro<\/h2>/u);
    assert.deepEqual(toc, [{ id: "intro", text: "Intro", depth: 2 }]);
  });

  it("leaves the body untouched when it does not start with an h1", async () => {
    const { html: output, toc } = await titleCompiler(
      "## Intro\n\n# Not First\n\nBody.",
    );
    assert.match(output, /<h2 id="intro">/u);
    assert.match(output, /Intro<\/h2>/u);
    assert.match(output, /<h1 id="not-first">/u);
    assert.match(output, /Not First<\/h1>/u);
    assert.equal(toc.length, 2);
  });
});

describe("heading anchors and table of contents", () => {
  it("assigns slugified ids to headings", async () => {
    const output = await html("## Hello World");
    assert.match(output, /<h2 id="hello-world">/u);
  });

  it("deduplicates repeated headings", async () => {
    const output = await html("## Same\n\n## Same");
    assert.match(output, /<h2 id="same">/u);
    assert.match(output, /<h2 id="same-1">/u);
  });

  it("builds a toc in document order with depth and text", async () => {
    const { toc } = await compile("# One\n\n### Three\n\n## Two");
    assert.deepEqual(toc, [
      { id: "one", text: "One", depth: 1 },
      { id: "three", text: "Three", depth: 3 },
      { id: "two", text: "Two", depth: 2 },
    ]);
  });

  it("links every toc item to a heading anchor in the body", async () => {
    const { html: output, toc } = await compile(
      "# Intro\n\n## Setup\n\n## Usage\n\n### Flags",
    );
    for (const item of toc) {
      assert.match(output, new RegExp(`id="${item.id}"`, "u"));
    }
  });

  it("adds a self permalink anchor to every heading", async () => {
    const { html: output, toc } = await compile(
      "# Intro\n\n## Setup\n\n## Usage",
    );
    for (const item of toc) {
      assert.match(
        output,
        new RegExp(
          `href="#${item.id}"[^>]*>#<\\/a>`,
          "u",
        ),
      );
    }
  });
});
