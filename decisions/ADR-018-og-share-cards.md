# ADR-018 — Per-Route Share Cards as `og.png` Route Handlers

- **Status:** Accepted
- **Date:** 2026-10-09
- **Topic:** architecture
- **RFC:** waived by the author, who chose generated cards directly when offered
  the options below.

## Context

Every page inherited the layout's Open Graph block: `og:title` was the site name
everywhere, there was no `og:url`, and no `og:image`, so shared links rendered
as bare text. The author asked for per-page `og:*` tags, "especially og:image".
The site is a Next.js static export (`output: "export"`) served by GitHub Pages
behind Cloudflare ([ADR-003](./ADR-003-cloudflare-cdn.md)), so every image must
exist as a file in `out/` with an extension the host maps to the right content
type.

## Decision

- **Every route gets its own 1200 × 630 PNG at `<path>og.png`**, rendered at
  build time by a `force-static` route handler, `og.png/route.tsx`, beside the
  route's `page.tsx` (the same pattern as `feed.xml/route.ts`). Dynamic routes
  (posts, tags) reuse the page's `generateStaticParams`.
- **`<path>og.png` is a public URL contract.** Links already shared point at it;
  renaming or moving it is a breaking change to shared previews.
- **Metadata comes from one helper** (`pageMetadata` / `articleMetadata` in
  `src/app/metadata.ts`) that sets title, description, canonical, `og:*`
  (`article:*` for posts), and `twitter:*` with `summary_large_image`, and
  points `og:image` at the route's card. Pages without a path (404) use the home
  card.
- **Cards follow the imagery rules:** the route's background source painted as
  phosphor dots, a Leader, the title in the display face, dark-theme tokens read
  from `globals.css`. The look is specified in `docs/imagery.md`.

## Options considered

| Option                                          | Outcome                                                                                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `opengraph-image.tsx` metadata files            | Rejected. A static export writes them as `out/<route>/opengraph-image` with no extension; GitHub Pages serves that as `application/octet-stream`, not as an image. |
| **`og.png/route.tsx` route handlers** (chosen)  | Real `out/**/og.png` files with the right content type; metadata points at them explicitly.                                                                        |
| Pre-rendered static PNGs committed to `public/` | No titles per post or tag without a script run per post; drifts from content.                                                                                      |
| Reuse the raw `bg.jpg` / post poster            | Fastest, but shows untreated source photos, which `docs/imagery.md` forbids; no title on the card.                                                                 |

## Rationale

Route handlers keep cards generated from the same content and tokens as the
pages, at build time, with no new runtime dependency (`next/og` ships with Next;
`sharp` was already a dev dependency). They are the only generated option that
yields correctly typed files on the current host.

## Consequences

- A new route adds an entry to `src/app/pages.ts` and an `og.png/route.tsx`
  beside its `page.tsx`; forgetting it leaves `og:image` pointing at a missing
  file.
- Satori cannot read woff2, so build-only TTF copies of the two faces live in
  `src/app/fonts/`; they are never served.
- Each card costs build time (image sampling and PNG encoding); theme, fonts,
  and each background's dot layer are cached per build worker.
- If the host ever maps extensionless files correctly, moving to
  `opengraph-image.tsx` would change every card URL and needs a new ADR.
