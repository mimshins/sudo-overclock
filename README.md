<div align="center">

<img width="256" alt="Logo" src="https://raw.githubusercontent.com/mimshins/sudo-overclock/refs/heads/main/soc-assembled-logo.svg" />

# Sudo: Overclock

Engineering blog of
[@mimshins (Mostafa Shamsitabar)](https://github.com/mimshins).

</div>

<hr />

## Tech Stack

- **React 19** - UI library
- **Next.js** - SSG framework (static export)
- **TypeScript** - Type safety
- **BaseUI** - Component library
- **Tailwind CSS** - Token/variable management only
- **CSS Modules** - Primary styling solution
- **Unified.js + Rehype + Remark** - Markdown processing pipeline
- **Shiki** - Build-time code highlighting
- **GitHub Pages** - Hosting (via GitHub Actions)

## Project Structure

The codebase is a layered, DDD-inspired module layout. See
[`AGENTS.md`](./AGENTS.md) for the authoritative architecture guide.

```
src/
├── app/                    # Composition root (App Router routes only)
├── shared/                 # Cross-cutting primitives
│   ├── ui/                 # Themed UI primitives (Button, Heading, ...)
│   └── lib/                # Framework-agnostic helpers
└── modules/
    └── blog/
        ├── domain/         # Pure types (Post, PostSummary, ...)
        ├── application/    # Use cases + ports
        ├── infrastructure/ # Content compiler + repository adapter
        ├── presentation/   # React components consumed by app/
        └── content/
            ├── raw/        # Source markdown (committed)
            └── compiled/   # Generated TS (gitignored, built at compile time)
scripts/                    # Compiler entrypoint
public/                     # Static assets + generated post images
```

## Content

Blog posts are authored as markdown in `src/modules/blog/content/raw/` and
compiled at build time. See [`docs/authoring.md`](./docs/authoring.md) for the
full authoring workflow.

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Compile raw markdown into generated content (runs automatically on build)
pnpm compile

# Build for production (static export to ./out)
pnpm build

# Run tests
pnpm test

# Lint + type-check + formatting check
pnpm check:lint

# Auto-fix formatting
pnpm format
```

> `public/posts/` and `src/modules/blog/content/compiled/` are generated and
> gitignored; both are produced on every `pnpm build` via the `prebuild` hook.

## Continuous Integration

Two GitHub Actions workflows live in `.github/workflows/`:

- **`ci.yml`** — on every push/PR to `main`: oxlint + oxfmt check, unit tests,
  and a production build.
- **`deploy.yml`** — on every push to `main`: production build (with
  `NEXT_PUBLIC_SITE_URL` set to the canonical domain) and deploy to GitHub Pages
  via `actions/deploy-pages`.

## Deployment (GitHub Pages)

The site is a Next.js **static export** (`output: "export"`) deployed to GitHub
Pages from GitHub Actions. Routes use root-relative paths because the site is
served from a custom domain apex; the intermediate
`mimshins.github.io/sudo-overclock/` URL will not render correctly until the
custom domain is configured.

### One-time setup

1. **Enable Pages from Actions** Repository **Settings → Pages → Source: GitHub
   Actions**. Until this is set, the `deploy` job fails.

2. **Configure the custom domain** (once `sudo-overclock.com` is pointed at
   GitHub) Repository **Settings → Pages → Custom domain**: enter
   `sudo-overclock.com` and **Save**, then **Enforce HTTPS**.

   When publishing from a custom GitHub Actions workflow GitHub ignores a
   `CNAME` file, so the domain must be set here (there is intentionally no
   `CNAME` in the repo).

3. **Point DNS at GitHub Pages** at your DNS provider For the apex
   `sudo-overclock.com` add four `A` records (or an `ALIAS`/`ANAME`):

   ```text
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   Optionally add `AAAA` records (see the
   [GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site))
   and a `www` `CNAME` → `mimshins.github.io`. DNS changes can take up to 24
   hours to propagate; HTTPS certificates appear after the domain resolves.

### Canonical URL

Sitemap, robots, RSS, and Open Graph URLs are rooted at `SITE_URL` in
`src/app/site.ts` (default `https://sudo-overclock.com`). The deploy workflow
sets `NEXT_PUBLIC_SITE_URL` explicitly; override it for any other host.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) and the module-boundary rules in
[`AGENTS.md`](./AGENTS.md). Component conventions are documented in
[`docs/components.md`](./docs/components.md).

## Requirements

- Node.js >= 24
- pnpm 10.22.0

## License

MIT - See [LICENSE](./LICENSE) for details.
