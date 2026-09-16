import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

import sharp from "sharp";

import { createMarkdownCompiler } from "./pipeline.ts";
import { getHighlighter } from "./shiki.ts";

const PNG_2X2 = await sharp({
  create: {
    width: 2,
    height: 2,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 1 },
  },
})
  .png()
  .toBuffer();

const SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"></svg>',
);

const HASHED_NAME =
  /\/posts\/demo\/[\w.-]+\.([a-f0-9]{12})\.(avif|webp|png|jpg)/u;

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

const hashOf = (html: string): string => {
  const hash = HASHED_NAME.exec(html)?.[1];

  if (hash === undefined) {
    throw new Error(`expected a hashed asset URL in: ${html}`);
  }

  return hash;
};

describe("rehypeAssets image enrichment", () => {
  it("transcodes local images into a picture with hashed variants", async () => {
    const { html, publicDir } = await compileWithAsset(
      "pixel.png",
      PNG_2X2,
      "## H\n\n![A pixel](./pixel.png)",
    );

    assert.match(html, /<picture data-slot="post-picture">/u);
    assert.match(html, /<source type="image\/avif" srcset="[^"]*\.avif">/u);
    assert.match(html, /<source type="image\/webp" srcset="[^"]*\.webp">/u);
    assert.match(html, /src="\/posts\/demo\/pixel\.[a-f0-9]{12}\.(png|jpg)"/u);
    assert.match(html, /width="2"/u);
    assert.match(html, /height="2"/u);
    assert.match(html, /loading="lazy"/u);
    assert.match(html, /decoding="async"/u);
    assert.match(html, /data-slot="post-image"/u);

    const fileName = /posts\/demo\/(pixel\.[a-f0-9]{12}\.avif)/u.exec(
      html,
    )?.[1];

    if (fileName === undefined) {
      throw new Error(`expected an AVIF variant URL in: ${html}`);
    }

    await access(join(publicDir, "posts", "demo", fileName));
  });

  it("is deterministic: the same bytes yield the same hash across runs", async () => {
    const first = await compileWithAsset(
      "pixel.png",
      PNG_2X2,
      "![A pixel](./pixel.png)",
    );
    const second = await compileWithAsset(
      "pixel.png",
      PNG_2X2,
      "![A pixel](./pixel.png)",
    );

    assert.equal(hashOf(first.html), hashOf(second.html));
  });

  it("changes the hash when the image bytes change", async () => {
    const original = await compileWithAsset(
      "pixel.png",
      PNG_2X2,
      "![A pixel](./pixel.png)",
    );
    const changed = await compileWithAsset(
      "pixel.png",
      Buffer.concat([PNG_2X2, Buffer.from([0])]),
      "![A pixel](./pixel.png)",
    );

    assert.notEqual(hashOf(original.html), hashOf(changed.html));
  });

  it("passes SVG through as a hashed plain image", async () => {
    const { html } = await compileWithAsset(
      "hero.svg",
      SVG,
      "![Hero](./hero.svg)",
    );

    assert.doesNotMatch(html, /<picture/u);
    assert.match(html, /src="\/posts\/demo\/hero\.[a-f0-9]{12}\.svg"/u);
    assert.match(html, /data-slot="post-image"/u);
    assert.match(html, /width="4"/u);
    assert.match(html, /height="3"/u);
  });

  it("leaves external and root-relative images untouched", async () => {
    const { html } = await compileWithAsset(
      "pixel.png",
      PNG_2X2,
      "![Remote](https://example.com/a.png)\n\n![Rooted](/a.png)",
    );

    assert.match(html, /src="https:\/\/example\.com\/a\.png"/u);
    assert.match(html, /src="\/a\.png"/u);
    assert.doesNotMatch(html, /data-slot="post-image"/u);
    assert.doesNotMatch(html, /width="/u);
  });

  it("degrades gracefully when the image cannot be decoded", async () => {
    const { html } = await compileWithAsset(
      "broken.png",
      Buffer.from("not an image"),
      "![Broken](./broken.png)",
    );

    assert.doesNotMatch(html, /<picture/u);
    assert.match(html, /src="\/posts\/demo\/broken\.[a-f0-9]{12}\.png"/u);
    assert.doesNotMatch(html, /width="/u);
    assert.doesNotMatch(html, /height="/u);
  });
});
