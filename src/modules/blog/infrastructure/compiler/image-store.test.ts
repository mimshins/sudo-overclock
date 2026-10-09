import assert from "node:assert/strict";
import {
  access,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

import type { StoredImage } from "./image-sidecar.ts";
import { createImageStore, sanitizeEncoderId } from "./image-store.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const HASH = "0123456789ab";
const ENCODER_ID = "sharp-0.35.4-vips-8.18.6";

const PICTURE: StoredImage = {
  kind: "picture",
  sources: [
    { type: "image/avif", extension: "avif" },
    { type: "image/webp", extension: "webp" },
  ],
  fallbackExtension: "png",
  width: 3,
  height: 2,
};

const VARIANTS = ["avif", "webp", "png"] as const;

const root = await mkdtemp(join(tmpdir(), "image-store-test-"));

after(async () => {
  await rm(root, { recursive: true, force: true });
});

let counter = 0;

const createFixture = async () => {
  counter += 1;
  const fixtureDir = join(root, `fixture-${counter}`);
  const sourceDir = join(fixtureDir, "source");
  const targetDir = join(fixtureDir, "target");
  const storeRoot = join(fixtureDir, "store");
  await mkdir(sourceDir, { recursive: true });
  await mkdir(targetDir, { recursive: true });
  await Promise.all(
    VARIANTS.map(extension =>
      writeFile(join(sourceDir, `img.${HASH}.${extension}`), extension),
    ),
  );

  return {
    store: createImageStore({ root: storeRoot, encoderId: ENCODER_ID }),
    storeRoot,
    encoderDir: join(storeRoot, sanitizeEncoderId(ENCODER_ID)),
    written: (extension: string) => join(sourceDir, `img.${HASH}.${extension}`),
    target: (extension: string) => join(targetDir, `img.${HASH}.${extension}`),
  };
};

const exists = (path: string): Promise<boolean> =>
  access(path).then(
    () => true,
    () => false,
  );

const age = async (paths: readonly string[], days: number): Promise<void> => {
  const time = new Date(Date.now() - days * DAY_MS);

  await Promise.all(paths.map(path => utimes(path, time, time)));
};

describe("sanitizeEncoderId", () => {
  it("keeps version strings and replaces path-unsafe characters", () => {
    assert.equal(sanitizeEncoderId(ENCODER_ID), ENCODER_ID);
    assert.equal(sanitizeEncoderId("a/b\\c d"), "a_b_c_d");
    assert.equal(sanitizeEncoderId(".."), "_");
  });
});

describe("createImageStore", () => {
  it("misses on an empty store", async () => {
    const { store, target } = await createFixture();

    assert.equal(await store.restore(HASH, target), null);
  });

  it("saves variants and a sidecar, then restores them by copy", async () => {
    const { store, encoderDir, written, target } = await createFixture();

    await store.save(HASH, PICTURE, written);

    assert.deepEqual((await readdir(encoderDir)).toSorted(), [
      `${HASH}.avif`,
      `${HASH}.json`,
      `${HASH}.png`,
      `${HASH}.webp`,
    ]);
    assert.deepEqual(await store.restore(HASH, target), PICTURE);

    const restored = await Promise.all(
      VARIANTS.map(extension => readFile(target(extension), "utf8")),
    );

    assert.deepEqual(restored, [...VARIANTS]);
  });

  it("marks an entry as used on a hit", async () => {
    const { store, encoderDir, written, target } = await createFixture();

    await store.save(HASH, PICTURE, written);
    const paths = (await readdir(encoderDir)).map(name =>
      join(encoderDir, name),
    );
    await age(paths, 40);
    await store.restore(HASH, target);

    const mtimes = await Promise.all(
      paths.map(async path => (await stat(path)).mtimeMs),
    );

    assert.ok(mtimes.every(mtime => mtime > Date.now() - DAY_MS));
  });

  it("treats a corrupt sidecar as a miss and recovers on the next save", async () => {
    const { store, encoderDir, written, target } = await createFixture();

    await store.save(HASH, PICTURE, written);
    await writeFile(join(encoderDir, `${HASH}.json`), "{ not json");

    assert.equal(await store.restore(HASH, target), null);

    await store.save(HASH, PICTURE, written);

    assert.deepEqual(await store.restore(HASH, target), PICTURE);
  });

  it("treats a sidecar for another hash or format version as a miss", async () => {
    const { store, encoderDir, written, target } = await createFixture();

    await store.save(HASH, PICTURE, written);
    const sidecarPath = join(encoderDir, `${HASH}.json`);
    const sidecar = await readFile(sidecarPath, "utf8");

    await writeFile(sidecarPath, sidecar.replace(HASH, "ffffffffffff"));
    assert.equal(await store.restore(HASH, target), null);

    await writeFile(
      sidecarPath,
      sidecar.replace('"version": 1', '"version": 0'),
    );
    assert.equal(await store.restore(HASH, target), null);
  });

  it("treats a missing variant as a miss", async () => {
    const { store, encoderDir, written, target } = await createFixture();

    await store.save(HASH, PICTURE, written);
    await rm(join(encoderDir, `${HASH}.webp`));

    assert.equal(await store.restore(HASH, target), null);
  });

  it("stores plain entries as a sidecar only", async () => {
    const { store, encoderDir, written, target } = await createFixture();

    await store.save(HASH, { kind: "plain" }, written);

    assert.deepEqual(await readdir(encoderDir), [`${HASH}.json`]);
    assert.deepEqual(await store.restore(HASH, target), { kind: "plain" });
  });

  it("prunes entries unused for 30 days, orphaned temp files, and stale encoders", async () => {
    const { store, storeRoot, encoderDir, written } = await createFixture();

    await store.save(HASH, PICTURE, written);
    const inUse = (await readdir(encoderDir)).map(name =>
      join(encoderDir, name),
    );
    const stale = ["aaaaaaaaaaaa.json", "aaaaaaaaaaaa.avif"].map(name =>
      join(encoderDir, name),
    );
    const recent = [join(encoderDir, "bbbbbbbbbbbb.json")];
    const orphan = [join(encoderDir, "cccccccccccc.0000.tmp")];
    const staleEncoder = join(storeRoot, "sharp-0.0.0-vips-0.0.0");
    await mkdir(staleEncoder);
    await Promise.all(
      [...stale, ...recent, ...orphan, join(staleEncoder, "x.json")].map(path =>
        writeFile(path, "{}"),
      ),
    );
    await Promise.all([
      age(stale, 31),
      age(orphan, 31),
      age(recent, 29),
      age(inUse.slice(0, 1), 40),
    ]);

    await store.prune();

    const removed = await Promise.all(
      [...stale, ...orphan, staleEncoder].map(path => exists(path)),
    );
    const kept = await Promise.all(
      [...recent, ...inUse].map(path => exists(path)),
    );

    assert.deepEqual(removed, [false, false, false, false]);
    assert.ok(kept.every(Boolean));
  });

  it("never throws when the store root is unusable", async () => {
    const { written, target, storeRoot } = await createFixture();
    await writeFile(storeRoot, "not a directory");
    const store = createImageStore({ root: storeRoot, encoderId: ENCODER_ID });

    await store.save(HASH, PICTURE, written);
    await store.prune();

    assert.equal(await store.restore(HASH, target), null);
  });
});
