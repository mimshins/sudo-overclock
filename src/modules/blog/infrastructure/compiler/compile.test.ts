import assert from "node:assert/strict";
import {
  access,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";
import { afterAll, describe, it } from "vitest";

import { compileAll } from "./compile.ts";
import { sharpImageEncoder, type ImageEncoder } from "./image-encoder.ts";
import { sanitizeEncoderId } from "./image-store.ts";

const solid = (width: number, height: number, channels: 3 | 4) =>
  sharp({
    create: { width, height, channels, background: { r: 9, g: 9, b: 9 } },
  });

const PNG_ALPHA = await solid(3, 2, 4).png().toBuffer();
const JPEG = await solid(4, 5, 3).jpeg().toBuffer();

const SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"></svg>',
);

const FRONTMATTER = "---\ntitle: Store\nslug: demo\n---\n\n";

const IMAGES = {
  "alpha.png": PNG_ALPHA,
  "photo.jpg": JPEG,
  "vector.svg": SVG,
};

const POST =
  "## Images\n\n![Alpha](./alpha.png)\n\n![Photo](./photo.jpg)\n\n![Vector](./vector.svg)\n";

const root = await mkdtemp(join(tmpdir(), "compile-test-"));

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

type Project = {
  readonly rawDir: string;
  readonly compiledDir: string;
  readonly publicDir: string;
  readonly cacheDir: string;
};

type CompileOutput = {
  readonly module: string;
  readonly files: ReadonlyMap<string, Buffer>;
};

let counter = 0;

const createProject = async (
  images: Readonly<Record<string, Buffer>>,
  markdown: string,
): Promise<Project> => {
  counter += 1;
  const projectDir = join(root, `project-${counter}`);
  const postDir = join(projectDir, "raw", "demo");
  await mkdir(postDir, { recursive: true });
  await writeFile(join(postDir, "index.md"), `${FRONTMATTER}${markdown}`);
  await Promise.all(
    Object.entries(images).map(([fileName, contents]) =>
      writeFile(join(postDir, fileName), contents),
    ),
  );

  return {
    rawDir: join(projectDir, "raw"),
    compiledDir: join(projectDir, "compiled"),
    publicDir: join(projectDir, "public"),
    cacheDir: join(projectDir, "cache"),
  };
};

const spyEncoder = (id: string) => {
  const calls = { inspect: 0, encode: 0 };
  const encoder: ImageEncoder = {
    id,
    inspect: source => {
      calls.inspect += 1;
      return sharpImageEncoder.inspect(source);
    },
    encode: (source, request) => {
      calls.encode += 1;
      return sharpImageEncoder.encode(source, request);
    },
  };

  return { calls, encoder };
};

const compile = async (
  project: Project,
  encoder: ImageEncoder,
  useStore: boolean,
): Promise<CompileOutput> => {
  await compileAll({
    rawDir: project.rawDir,
    compiledDir: project.compiledDir,
    publicDir: project.publicDir,
    imageCacheDir: useStore ? project.cacheDir : null,
    imageEncoder: encoder,
  });

  const postsDir = join(project.publicDir, "posts", "demo");
  const names = (await readdir(postsDir)).toSorted();
  const contents = await Promise.all(
    names.map(name => readFile(join(postsDir, name))),
  );

  return {
    module: await readFile(join(project.compiledDir, "index.ts"), "utf8"),
    files: new Map(names.map((name, index) => [name, contents[index]!])),
  };
};

const encoderDir = (project: Project, id: string): string =>
  join(project.cacheDir, sanitizeEncoderId(id));

const hashOf = (output: CompileOutput, baseName: string): string => {
  const pattern = new RegExp(`^${baseName}\\.([a-f0-9]{12})\\.`, "u");
  const hash = [...output.files.keys()]
    .map(name => pattern.exec(name)?.[1])
    .find(match => match !== undefined);

  if (hash === undefined) {
    throw new Error(`no hashed output for ${baseName}`);
  }

  return hash;
};

const exists = (path: string): Promise<boolean> =>
  access(path).then(
    () => true,
    () => false,
  );

describe("compileAll with the image store", () => {
  it("encodes on a miss and populates the store", async () => {
    const project = await createProject(IMAGES, POST);
    const { calls, encoder } = spyEncoder("encoder-a");

    const output = await compile(project, encoder, true);
    const alpha = hashOf(output, "alpha");
    const photo = hashOf(output, "photo");
    const sidecar = await readFile(
      join(encoderDir(project, encoder.id), `${alpha}.json`),
      "utf8",
    );

    assert.equal(calls.encode, 2);
    assert.deepEqual(
      (await readdir(encoderDir(project, encoder.id))).toSorted(),
      [
        `${alpha}.avif`,
        `${alpha}.json`,
        `${alpha}.png`,
        `${alpha}.webp`,
        `${photo}.avif`,
        `${photo}.jpg`,
        `${photo}.json`,
        `${photo}.webp`,
      ].toSorted(),
    );
    assert.match(sidecar, /"kind": "picture"/u);
    assert.match(sidecar, /"width": 3/u);
    assert.match(sidecar, /"height": 2/u);
  });

  it("restores a hit without decoding or encoding", async () => {
    const project = await createProject(IMAGES, POST);
    const { calls, encoder } = spyEncoder("encoder-a");

    const cold = await compile(project, encoder, true);
    calls.inspect = 0;
    calls.encode = 0;
    const warm = await compile(project, encoder, true);

    assert.equal(calls.inspect, 0);
    assert.equal(calls.encode, 0);
    assert.equal(warm.module, cold.module);
    assert.deepEqual(warm.files, cold.files);
  });

  it("misses on an encoder change and prunes the stale encoder directory", async () => {
    const project = await createProject(IMAGES, POST);
    const first = spyEncoder("sharp-1.0.0-vips-8.0.0");
    const second = spyEncoder("sharp-2.0.0-vips-9.0.0");

    await compile(project, first.encoder, true);
    await compile(project, second.encoder, true);

    assert.equal(second.calls.encode, 2);
    assert.equal(await exists(encoderDir(project, first.encoder.id)), false);
    assert.equal(await exists(encoderDir(project, second.encoder.id)), true);
  });

  it("recovers from a corrupt sidecar by re-encoding that image", async () => {
    const project = await createProject(IMAGES, POST);
    const { calls, encoder } = spyEncoder("encoder-a");

    const cold = await compile(project, encoder, true);
    await writeFile(
      join(encoderDir(project, encoder.id), `${hashOf(cold, "alpha")}.json`),
      "{ not json",
    );
    calls.encode = 0;
    const recovered = await compile(project, encoder, true);
    const recoveredEncodes = calls.encode;
    calls.encode = 0;
    await compile(project, encoder, true);

    assert.equal(recoveredEncodes, 1);
    assert.equal(calls.encode, 0);
    assert.deepEqual(recovered.files, cold.files);
  });

  it("emits identical filenames and markup with and without the store", async () => {
    const project = await createProject(IMAGES, POST);
    const { encoder } = spyEncoder("encoder-a");

    const uncached = await compile(project, encoder, false);
    const cold = await compile(project, encoder, true);
    const warm = await compile(project, encoder, true);

    assert.equal(cold.module, uncached.module);
    assert.equal(warm.module, uncached.module);
    assert.deepEqual([...cold.files.keys()], [...uncached.files.keys()]);
    assert.deepEqual(warm.files, cold.files);
  });

  it("stores animated images as plain entries", async () => {
    const project = await createProject(
      { "photo.jpg": JPEG },
      "![A](./photo.jpg)",
    );
    const calls = { inspect: 0, encode: 0 };
    const encoder: ImageEncoder = {
      id: "animated-encoder",
      inspect: () => {
        calls.inspect += 1;
        return Promise.resolve({ animated: true, hasAlpha: false });
      },
      encode: () => {
        calls.encode += 1;
        return Promise.reject(new Error("animated images are never encoded"));
      },
    };

    const cold = await compile(project, encoder, true);
    const warm = await compile(project, encoder, true);

    assert.equal(calls.inspect, 1);
    assert.equal(calls.encode, 0);
    assert.equal(warm.module, cold.module);
    assert.doesNotMatch(warm.module, /<picture/u);
    assert.deepEqual([...warm.files.values()], [JPEG]);
  });

  it("does not store decode failures", async () => {
    const project = await createProject(
      { "broken.png": Buffer.from("not an image") },
      "![Broken](./broken.png)",
    );
    const { calls, encoder } = spyEncoder("encoder-a");

    await compile(project, encoder, true);
    await compile(project, encoder, true);

    assert.equal(calls.inspect, 2);
    assert.equal(await exists(encoderDir(project, encoder.id)), false);
  });

  it("never fails the compile when the store is unusable", async () => {
    const project = await createProject(IMAGES, POST);
    const { calls, encoder } = spyEncoder("encoder-a");
    await writeFile(project.cacheDir, "not a directory");

    const uncached = await compile(project, encoder, false);
    calls.encode = 0;
    const output = await compile(project, encoder, true);

    assert.equal(calls.encode, 2);
    assert.equal(output.module, uncached.module);
  });
});
