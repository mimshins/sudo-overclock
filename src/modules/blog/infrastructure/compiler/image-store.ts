/*
 * Persistent, content-addressed image store.
 *
 * `compileAll` rebuilds `public/posts/` from scratch on every run, so without a
 * store every image would be decoded and re-encoded each compile. The store
 * keeps each prepared image's variants and a JSON sidecar under
 * `<root>/<encoder>/`, keyed by the same content hash that names the public
 * files, so a hit is a plain file copy — no decode, no encode.
 *
 * Layout: `<root>/<encoder>/<hash>.json` (the sidecar) plus one
 * `<hash>.<extension>` per variant. `<encoder>` identifies the encoder build
 * (e.g. the `sharp` + libvips versions), so an upgrade starts a fresh directory
 * and leaves URLs unchanged. Writes go to a temporary name in the same directory
 * and are renamed into place, variants first and the sidecar last, so a reader
 * sees either a complete entry or a miss.
 *
 * Pruning ages entries by their newest file, but ages a temporary file by its
 * own time with a short grace period, so an orphan left by a crashed write goes
 * even while its entry is in use, and a write in progress in a concurrent
 * compile survives. Each file is re-checked just before removal, so an entry
 * another compile restored after the scan is kept.
 *
 * Every store failure is non-fatal: a broken entry is a miss, and a failed write
 * or prune warns and the compile carries on.
 */

import { randomUUID } from "node:crypto";
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  utimes,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";

import {
  parseSidecar,
  serializeSidecar,
  variantExtensions,
  SIDECAR_EXTENSION,
  type StoredImage,
} from "./image-sidecar.ts";

/** Maps a variant's extension to its absolute path in `public/posts/<slug>/`. */
type VariantPath = (extension: string) => string;

type ImageStore = {
  /**
   * Copies a stored entry's variants into place and returns its description, or
   * `null` on a miss (absent, corrupt, or incomplete entry).
   */
  readonly restore: (
    hash: string,
    target: VariantPath,
  ) => Promise<StoredImage | null>;
  /** Copies freshly written variants into the store and commits the sidecar. */
  readonly save: (
    hash: string,
    image: StoredImage,
    written: VariantPath,
  ) => Promise<void>;
  /**
   * Deletes entries unused for longer than `maxAgeMs` and every other encoder
   * directory under the root.
   */
  readonly prune: () => Promise<void>;
};

type ImageStoreOptions = {
  /** Absolute path to the store root (one directory per encoder below it). */
  readonly root: string;
  /** Encoder identity; sanitized into the encoder directory name. */
  readonly encoderId: string;
  /** Entries whose last use is older than this are pruned. */
  readonly maxAgeMs?: number;
  readonly now?: () => number;
};

const DEFAULT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const TEMP_GRACE_MS = 60 * 60 * 1000;
const TEMP_SUFFIX = ".tmp";

const HASH_PATTERN = /^[a-f0-9]+$/u;

const sanitizeEncoderId = (encoderId: string): string =>
  encoderId.replaceAll(/[^\w.-]/gu, "_").replace(/^\.+/u, "_") || "_";

const warn = (message: string): void => {
  process.stderr.write(`[compile] image store: ${message}\n`);
};

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const ignoreFailure = (): null => null;

const emptyWhenMissing = (error: unknown): string[] => {
  if (error instanceof Error && "code" in error && error.code === "ENOENT") {
    return [];
  }

  throw error;
};

const entryKey = (fileName: string): string => {
  const dot = fileName.indexOf(".");

  return dot === -1 ? fileName : fileName.slice(0, dot);
};

const createImageStore = (options: ImageStoreOptions): ImageStore => {
  const { root } = options;
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  const now = options.now ?? Date.now;
  const encoderDirName = sanitizeEncoderId(options.encoderId);
  const encoderDir = join(root, encoderDirName);

  const storedPath = (hash: string, extension: string): string =>
    join(encoderDir, `${hash}.${extension}`);

  const touch = async (paths: readonly string[]): Promise<void> => {
    const time = new Date(now());

    await Promise.all(
      paths.map(path => utimes(path, time, time).catch(ignoreFailure)),
    );
  };

  const commit = async (
    hash: string,
    finalPath: string,
    write: (tempPath: string) => Promise<void>,
  ): Promise<void> => {
    const tempPath = join(encoderDir, `${hash}.${randomUUID()}${TEMP_SUFFIX}`);

    try {
      await write(tempPath);
      await rename(tempPath, finalPath);
    } catch (error) {
      await rm(tempPath, { force: true }).catch(ignoreFailure);
      throw error;
    }
  };

  const restore: ImageStore["restore"] = async (hash, target) => {
    if (!HASH_PATTERN.test(hash)) {
      return null;
    }

    const sidecarPath = storedPath(hash, SIDECAR_EXTENSION);

    try {
      const image = parseSidecar(await readFile(sidecarPath, "utf8"), hash);

      if (image === null) {
        return null;
      }

      const variants = variantExtensions(image).map(extension => ({
        from: storedPath(hash, extension),
        to: target(extension),
      }));

      await Promise.all(variants.map(({ from, to }) => copyFile(from, to)));
      await touch([sidecarPath, ...variants.map(({ from }) => from)]);

      return image;
    } catch {
      return null;
    }
  };

  const save: ImageStore["save"] = async (hash, image, written) => {
    if (!HASH_PATTERN.test(hash)) {
      return;
    }

    try {
      await mkdir(encoderDir, { recursive: true });

      await Promise.all(
        variantExtensions(image).map(extension =>
          commit(hash, storedPath(hash, extension), tempPath =>
            copyFile(written(extension), tempPath),
          ),
        ),
      );

      await commit(hash, storedPath(hash, SIDECAR_EXTENSION), tempPath =>
        writeFile(tempPath, serializeSidecar(hash, image), "utf8"),
      );
    } catch (error) {
      warn(`could not store ${hash}: ${describeError(error)}`);
    }
  };

  const pruneEncoderDir = async (): Promise<void> => {
    const fileNames = await readdir(encoderDir).catch(emptyWhenMissing);
    const files = await Promise.all(
      fileNames.map(async fileName => {
        const path = join(encoderDir, fileName);
        const stats = await stat(path).catch(ignoreFailure);

        return {
          path,
          key: entryKey(fileName),
          temp: fileName.endsWith(TEMP_SUFFIX),
          mtimeMs: stats?.mtimeMs,
        };
      }),
    );

    const lastUsed = new Map<string, number>();

    for (const { key, temp, mtimeMs } of files) {
      if (!temp && mtimeMs !== undefined) {
        lastUsed.set(key, Math.max(lastUsed.get(key) ?? 0, mtimeMs));
      }
    }

    const entryCutoff = now() - maxAgeMs;
    const tempCutoff = now() - TEMP_GRACE_MS;

    const removeIfUnused = async (
      path: string,
      cutoff: number,
    ): Promise<void> => {
      const stats = await stat(path).catch(ignoreFailure);

      if (stats !== null && stats.mtimeMs < cutoff) {
        await rm(path, { force: true });
      }
    };

    await Promise.all(
      files.flatMap(({ path, key, temp, mtimeMs }) => {
        if (temp) {
          return (mtimeMs ?? tempCutoff) < tempCutoff
            ? [removeIfUnused(path, tempCutoff)]
            : [];
        }

        return (lastUsed.get(key) ?? entryCutoff) < entryCutoff
          ? [removeIfUnused(path, entryCutoff)]
          : [];
      }),
    );
  };

  const pruneStaleEncoders = async (): Promise<void> => {
    const fileNames = await readdir(root).catch(emptyWhenMissing);

    await Promise.all(
      fileNames
        .filter(fileName => fileName !== encoderDirName)
        .map(fileName =>
          rm(join(root, fileName), { recursive: true, force: true }),
        ),
    );
  };

  const prune: ImageStore["prune"] = async () => {
    try {
      await pruneEncoderDir();
      await pruneStaleEncoders();
    } catch (error) {
      warn(`prune failed: ${describeError(error)}`);
    }
  };

  return { restore, save, prune };
};

export { createImageStore, sanitizeEncoderId };
export type { ImageStore, ImageStoreOptions, VariantPath };
