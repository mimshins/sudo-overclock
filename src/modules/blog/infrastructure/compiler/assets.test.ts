import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

import { createMarkdownCompiler } from "./pipeline.ts";
import { getHighlighter } from "./shiki.ts";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const highlighter = await getHighlighter();

const root = await mkdtemp(join(tmpdir(), "assets-test-"));

after(async () => {
  await rm(root, { recursive: true, force: true });
});

let counter = 0;

const compileWithAsset = async (
  fileName: string,
  contents: Buffer,
  markdown: string,
): Promise<{ readonly html: string; readonly publicDir: string }> => {
  counter += 1;
  const postDir = join(root, `post-${counter}`);
  const publicDir = join(root, `public-${counter}`);
  await mkdir(postDir, { recursive: true });
  await writeFile(join(postDir, fileName), contents);

  const compile = createMarkdownCompiler({
    highlighter,
    assets: { postDir, slug: "demo", publicDir },
  });

  const { html } = await compile(markdown);
  return { html, publicDir };
};

describe("rehypeAssets image enrichment", () => {
  it("adds dimensions and best-practice attributes to local images", async () => {
    const { html, publicDir } = await compileWithAsset(
      "pixel.png",
      PNG_1X1,
      "## H\n\n![A pixel](./pixel.png)",
    );

    assert.match(html, /src="\/posts\/demo\/pixel\.png"/u);
    assert.match(html, /width="1"/u);
    assert.match(html, /height="1"/u);
    assert.match(html, /loading="lazy"/u);
    assert.match(html, /decoding="async"/u);
    assert.match(html, /data-slot="post-image"/u);
    await access(join(publicDir, "posts", "demo", "pixel.png"));
  });

  it("leaves external and root-relative images untouched", async () => {
    const { html } = await compileWithAsset(
      "pixel.png",
      PNG_1X1,
      "![Remote](https://example.com/a.png)\n\n![Rooted](/a.png)",
    );

    assert.match(html, /src="https:\/\/example\.com\/a\.png"/u);
    assert.match(html, /src="\/a\.png"/u);
    assert.doesNotMatch(html, /data-slot="post-image"/u);
    assert.doesNotMatch(html, /width="/u);
  });

  it("degrades gracefully when dimensions cannot be read", async () => {
    const { html } = await compileWithAsset(
      "broken.png",
      Buffer.from("not an image"),
      "![Broken](./broken.png)",
    );

    assert.match(html, /src="\/posts\/demo\/broken\.png"/u);
    assert.doesNotMatch(html, /width="/u);
    assert.doesNotMatch(html, /height="/u);
  });
});
