/*
 * Site-wide constants for SEO and feeds.
 *
 * Set NEXT_PUBLIC_SITE_URL at build time (or on the host) to the final domain;
 * until then the placeholder below keeps sitemap/RSS/OG URLs well-formed.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sudo-overclock.dev";
const SITE_NAME = "sudo-overclock";
const SITE_DESCRIPTION =
  "Engineering log of @mimshins (Mostafa Shamsitabar) — platform, developer experience, and the tooling engineers build on.";
const AUTHOR_NAME = "Mostafa Shamsitabar";
const TWITTER_HANDLE = "@mimshins";

export { AUTHOR_NAME, SITE_DESCRIPTION, SITE_NAME, SITE_URL, TWITTER_HANDLE };
