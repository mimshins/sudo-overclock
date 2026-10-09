import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import type { NextConfig } from "next";

const packageVersion = (): string => {
  const manifest: unknown = JSON.parse(
    readFileSync(new URL("./package.json", import.meta.url), "utf8"),
  );

  return typeof manifest === "object" &&
    manifest !== null &&
    "version" in manifest &&
    typeof manifest.version === "string"
    ? manifest.version
    : "dev";
};

const contentRevision = (): string => {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "local";
  }
};

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  turbopack: {
    root: import.meta.dirname,
  },
  env: {
    NEXT_PUBLIC_SITE_VERSION:
      process.env.NEXT_PUBLIC_SITE_VERSION ?? packageVersion(),
    NEXT_PUBLIC_CONTENT_SHA:
      process.env.NEXT_PUBLIC_CONTENT_SHA ?? contentRevision(),
  },
};

export default config;
