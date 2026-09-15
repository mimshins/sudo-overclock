/*
 * Site-wide constants for SEO and feeds.
 *
 * The canonical domain is the GitHub Pages custom domain. Set
 * NEXT_PUBLIC_SITE_URL at build time to override it (used by the deploy
 * workflow so sitemap/RSS/OG always reference the final host).
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sudo-overclock.space";
const SITE_NAME = "sudo-overclock";
const SITE_DESCRIPTION =
  "Engineering log of @mimshins (Mostafa Shamsitabar) — platform, developer experience, and the tooling engineers build on.";
const AUTHOR_NAME = "Mostafa Shamsitabar";
const TWITTER_HANDLE = "@mimshins";

export { AUTHOR_NAME, SITE_DESCRIPTION, SITE_NAME, SITE_URL, TWITTER_HANDLE };
