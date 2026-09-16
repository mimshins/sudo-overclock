# 001 — Cloudflare CDN in front of GitHub Pages

- **Date:** 2026-09-16
- **Topic:** infrastructure / hosting
- **RFC:** [`.ai/rfc/003-cloudflare-cdn.md`](../../rfc/003-cloudflare-cdn.md)

## Context

sudo-overclock is a static Next.js export served from GitHub Pages at
`sudo-overclock.space`. GitHub Pages gives no control over cache policy, edge
redirects, or TLS. The goal was a free CDN in front of the existing origin with
edge caching for fingerprinted assets, an apex-canonical redirect, and a single
TLS termination point — without changing the build or deploy pipeline.

## Decision

Adopt **Cloudflare's free plan as a proxy in front of GitHub Pages** (RFC Option
A), rather than migrating to Cloudflare Pages. On verification the apex was
already delegated to Cloudflare (`jewel`/`bowen.ns.cloudflare.com`) and proxied,
so no repository change was required. The intended configuration is: proxied
`A`/`CNAME` records mirroring GitHub Pages, **Full (strict)** TLS with Always
Use HTTPS, **assets-only** edge caching (HTML left `DYNAMIC` so every deploy is
instantly visible, with no purge step), `www` → apex 301, and `/.well-known/*`
never cached so GitHub Pages' ACME renewal keeps working.

## Rationale

The proxy keeps the existing Actions deploy, canonical URL, and origin; it is
reversible by changing nameservers; and it needs no cache-purge token in
`deploy.yml`. Migrating to Cloudflare Pages would rewrite `deploy.yml`, the
README, and the runbook for a benefit a low-churn static site doesn't need.
Leaving HTML uncached trades a little edge latency for correctness and zero
purge plumbing — fail-open means a misconfigured rule yields an origin fetch,
never a stale page.

## Consequences

- `/_next/static/*` and post assets are `HIT` at the edge; HTML is `DYNAMIC`;
  `http` and `www` collapse to the apex with a 301.
- Content-addressed post images (RFC 004) removed the original staleness risk
  and make `/posts/**` safe to cache aggressively.
- **Open follow-ups (not yet confirmed in the dashboard):** no explicit Cache
  Rule or Single Redirect was observed — the `www` redirect is served `DYNAMIC`
  by the GitHub origin, and fingerprinted assets are browser-capped at
  Cloudflare's default 4-hour TTL instead of the origin's immutable value. TLS
  mode is not externally verifiable.
- Cloudflare is now a hard dependency in front of GitHub Pages; the origin is
  public, so records can be reverted to grey or the registrar's nameservers.
- `README.md` and `docs/runbook.md` CDN sections remain to be written.
