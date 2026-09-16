# 003 — Cloudflare CDN in front of GitHub Pages

- **Status:** Implemented
- **Date:** 2026-09-16
- **Supersedes:** —
- **Superseded by:** —

## Context

sudo-overclock is a fully static Next.js export (`output: "export"`) served from
GitHub Pages at the apex `sudo-overclock.space`. GitHub Pages fronts the origin
with Fastly, but the project controls no cache policy, no edge redirects, and no
WAF: HTML is served with `Cache-Control: max-age=600` and fingerprinted assets
(`/_next/static/*`) are served `immutable` but with no guarantee they are cached
at an edge near the reader.

The goal is a CDN in front of the existing origin with edge caching for
fingerprinted assets, an apex-canonical redirect from `www`, and a single TLS
termination point — with **no change to the build or deploy pipeline** and no
server runtime. The only viable free option that satisfies all of this without
moving hosts is Cloudflare's free plan (unlimited CDN bandwidth, Universal SSL,
Cache Rules and Single Redirects included).

Two constraints shape the design: (1) the site has no server, so caching must be
configured at the edge, not through response headers (Cloudflare's CDN proxy
ignores a `_headers` file — that is a Cloudflare Pages / Netlify feature); and
(2) GitHub Pages provisions and renews its own TLS certificate by validating the
domain over DNS/HTTP, so a naive proxied setup can disrupt certificate renewal.

## Options

### Option A — Cloudflare proxy in front of GitHub Pages

- **Pros:** Smallest possible change. Keeps the existing Actions deploy, the
  existing canonical URL, and the existing origin. Free plan covers CDN,
  caching, Universal SSL, `www` redirect, and HTTP→HTTPS. Reversible by
  switching nameservers back.
- **Cons:** Full DNS setup requires delegating the domain to Cloudflare's
  nameservers (partial/CNAME setup is Business-only). Cloudflare becomes a hard
  runtime dependency. GitHub Pages certificate renewal must be kept working
  behind the proxy.

### Option B — Migrate hosting to Cloudflare Pages

- **Pros:** Native edge caching, `_headers`/`_redirects` support, automatic
  cache invalidation on deploy, preview deployments.
- **Cons:** Replaces the origin and rewrites `deploy.yml`, the README, and the
  runbook. Larger blast radius for a benefit the free proxy already provides to
  a static site that changes infrequently.

### Option C — Do nothing

- **Pros:** Zero configuration.
- **Cons:** No control over cache policy or edge redirects; `www` and `http`
  handling rely entirely on GitHub Pages defaults.

## Decision

Adopt **Option A**. Onboard `sudo-overclock.space` to Cloudflare's free plan via
a full nameserver delegation, recreate the GitHub Pages records as **proxied
(orange cloud)** — apex `A` to
`185.199.108.153`/`.109.153`/`.110.153`/`.111.153` and `www` `CNAME` to
`mimshins.github.io` — and configure:

- **TLS:** SSL/TLS mode **Full (strict)** (GitHub Pages serves a valid
  certificate) with **Always Use HTTPS** on.
- **Canonical host:** the apex stays canonical (unchanged `SITE_URL`); `www` is
  301-redirected to the apex with a Single Redirect rule.
- **Caching:** **assets-only.** Fingerprinted `/_next/static/*` and the
  un-hashed `public/posts/*` assets are cached at the edge; **HTML is explicitly
  left uncached** and served from origin. This is the decisive trade-off: it
  keeps every deploy instantly visible and removes the need for any cache-purge
  step or API token in `deploy.yml`.
- **Certificate safety:** `/.well-known/*` (GitHub's ACME HTTP-01 path) is never
  cached, and records begin **DNS-only (grey)** until GitHub reports the Pages
  custom domain verified and HTTPS enforced, then switch to proxied.

The build output, `NEXT_PUBLIC_SITE_URL`, and the two Actions workflows are
unchanged. This RFC decides the hosting/CDN architecture only; the concrete
documentation and configuration work is specified in
`.ai/specs/cloudflare-cdn.md`.

## As-built (observed 2026-09-16)

The zone was already delegated to Cloudflare when this was verified, so Option A
is live without any repository change. External checks against
`https://sudo-overclock.space`:

- `dig NS` → `jewel.ns.cloudflare.com`, `bowen.ns.cloudflare.com`; apex and
  `www` resolve to Cloudflare anycast (`104.21.90.151`, `172.67.157.228`).
- TLS terminates at Cloudflare (Let's Encrypt, `CN=sudo-overclock.space`, TLS
  1.3); the encryption mode is **not externally verifiable**.
- HTML (`/`, `/blog/`) → `cf-cache-status: DYNAMIC`, origin
  `Cache-Control: max-age=600` passed through.
- `/_next/static/*` → `HIT` on repeat with `age` increasing, but
  `Cache-Control: max-age=14400` — Cloudflare's default browser TTL
  **overriding** the origin's long/immutable value rather than respecting it.
- `/posts/<slug>/<image>` → `HIT` on repeat (per-POP).
- `/.well-known/acme-challenge/*` → `DYNAMIC` (uncached, but by default, not by
  an explicit bypass rule).
- `http://` → `https://` 301; `https://www/<path>` → apex `/<path>` 301
  preserving the path, served by the **GitHub origin** (`x-github-request-id`),
  not a Cloudflare Single Redirect (no rule confirmed).

**Deviations from the design above:** no Cache Rule or Single Redirect could be
confirmed; the observed behavior is Cloudflare defaults plus the GitHub origin's
own redirect. The `www` redirect therefore round-trips to the origin on every
request. Cloudflare's cache is per-POP, not global, and `cf-cache-status`
reflects the edge, not the browser — an incognito first load still fetches (as
expected).

## Amendment — content-addressed post assets (RFC 004)

[RFC 004](./004-post-asset-pipeline.md) changed local post images from stable,
un-hashed `public/posts/<slug>/<file>` URLs to content-addressed
`<file>.<hash>.<ext>` variants. This retires the staleness risk noted below and
**strengthens** the caching decision: `/posts/**` can now be cached
aggressively, because a changed image gets a new URL. The remaining work is to
make Cloudflare honor that — see Follow-ups.

## Follow-ups

- Set a Cache Rule (or Browser Cache TTL setting) so fingerprinted
  `/_next/static/*` and `/posts/**` are cached long/immutably instead of the
  observed 4-hour default override.
- Add an explicit `/.well-known/*` bypass Cache Rule (currently uncached only by
  default).
- Move the `www` → apex 301 to a Cloudflare Single Redirect so it is handled at
  the edge and no longer `DYNAMIC` against the origin.
- Confirm SSL/TLS mode is Full (strict) and Always Use HTTPS is enabled in the
  dashboard (both are behaviorally consistent with what is observed).

## Consequences

- Readers hit a Cloudflare edge for `/_next/static/*` assets; HTML continues to
  reflect the newest deploy immediately with no purge plumbing. Post images are
  now content-addressed (RFC 004), so they are safe to cache aggressively — the
  original "un-hashed post image" caveat no longer applies.
- `http://` and `www` variants collapse to `https://sudo-overclock.space` with a
  single 301, preserving the canonical root used by sitemap, robots, RSS, and
  Open Graph. Today the `www` redirect is served by the GitHub origin rather
  than at the edge (see Follow-ups).
- Cloudflare becomes a hard dependency in front of GitHub Pages: an outage or a
  mis-scoped DNS record takes the site down. Mitigation is that the origin is
  public and records can be reverted to grey or to the registrar's nameservers.
- GitHub Pages certificate renewal must be monitored once, at the first renewal
  window after the switch; the `/.well-known/*` and grey-then-proxied rules
  exist for this reason.
- The fingerprinted-asset cache is currently capped by Cloudflare's 4-hour
  default browser TTL rather than the origin's immutable value; tightening this
  is a follow-up.
- Documentation: `docs/runbook.md` and `README.md` CDN sections are still
  pending. The decision is recorded in
  [`.ai/memory/infra/001-cloudflare-cdn.md`](../memory/infra/001-cloudflare-cdn.md).
