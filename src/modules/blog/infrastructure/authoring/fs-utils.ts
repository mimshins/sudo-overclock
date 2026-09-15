/*
 * Filesystem helpers shared by the authoring commands.
 */

import type { Dirent } from "node:fs";
import { access, cp, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const pathExists = async (target: string): Promise<boolean> => {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
};

const listDirectoryNames = async (dir: string): Promise<readonly string[]> => {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
};

/**
 * Copy the _contents_ of `fromDir` into `toDir` (flat per top-level entry).
 * Missing source directory is a no-op — a draft may have no assets.
 */
const copyDirectoryContents = async (
  fromDir: string,
  toDir: string,
): Promise<number> => {
  let entries: Dirent[];
  try {
    entries = await readdir(fromDir, { withFileTypes: true });
  } catch {
    return 0;
  }

  const copied = await Promise.all(
    entries
      .filter((entry) => entry.name !== ".gitkeep")
      .map((entry) =>
        cp(resolve(fromDir, entry.name), resolve(toDir, entry.name), {
          recursive: true,
        }),
      ),
  );

  return copied.length;
};

export { copyDirectoryContents, listDirectoryNames, pathExists };
