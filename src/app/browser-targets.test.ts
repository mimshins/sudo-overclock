import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

const manifest: unknown = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../package.json"), "utf8"),
);

const pinned =
  typeof manifest === "object" &&
  manifest !== null &&
  "browserslist" in manifest
    ? manifest.browserslist
    : null;

describe("browser targets", () => {
  it("pin the same baseline Next compiles for by default", () => {
    const nextDefault: unknown = require("next/dist/shared/lib/modern-browserslist-target.js");

    expect(pinned).toEqual(nextDefault);
  });
});
