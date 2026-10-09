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
- **JetBrains Mono** - Text typeface
- **undefined medium** - Display typeface (wordmark + `h1`/`h2`)
- **Unified.js + Rehype + Remark** - Markdown processing pipeline
- **Shiki** - Build-time code highlighting
- **yaml** - Post front matter
- **Vitest + Testing Library** - Unit, integration, and component tests
- **oxlint + oxfmt + stylelint** - Linting, formatting, and design-token rules
- **wireit** - Content-addressed task caching (local and CI)
- **Changesets** - Semver releases and changelogs
- **GitHub Pages** - Hosting (via GitHub Actions)

## Project Structure

The codebase is a layered, DDD-inspired module layout. The authoritative guide
is [`docs/architecture.md`](./docs/architecture.md); [`AGENTS.md`](./AGENTS.md)
is the onboarding index and lists the non-negotiable rules.

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
        ├── infrastructure/ # Content compiler, repository adapter, authoring CLI
        ├── presentation/   # React components consumed by app/
        └── content/
            ├── raw/        # Published source markdown (committed)
            ├── drafts/     # In-progress posts (excluded from the build)
            └── compiled/   # Generated TS (gitignored, built at compile time)
scripts/                    # Compiler + authoring entrypoints
public/                     # Static assets + generated post images
docs/                       # Current-state docs: architecture, design, authoring, runbook
decisions/                  # Accepted decisions (ADRs)
rfcs/                       # Proposals: active/ and archived/
.ai/                        # AI tooling only: memories, skills, agents, templates
```

## Content

Blog posts are authored as markdown under `src/modules/blog/content/raw/` and
compiled at build time. Writing follows a staged, human-led pipeline documented
in [`docs/authoring.md`](./docs/authoring.md#writing-pipeline); drafts live in
`src/modules/blog/content/drafts/<slug>/` and are excluded from the build.

```sh
pnpm author:new <slug>        # scaffold a draft
pnpm author:preflight <slug>  # validate it
pnpm author:publish <slug>    # move it into content/raw/
```

See [`docs/authoring.md`](./docs/authoring.md) for frontmatter and body rules,
and [`docs/runbook.md`](./docs/runbook.md) for commands and troubleshooting.

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
> gitignored; `pnpm build` compiles them first whenever their inputs changed.

## Continuous Integration

Three GitHub Actions workflows live in `.github/workflows/`:

- **`ci.yml`** — on every push/PR: lint (oxlint, stylelint, oxfmt), tests, and a
  production build; on PRs, checks for a changeset; weekly, a clean build with
  no caches. On `main`, a push that changes posts triggers a deploy. Tasks are
  cached with wireit (see
  [`docs/runbook.md`](./docs/runbook.md#task-caching-wireit)).
- **`release.yml`** — on every push to `main`: keeps the changesets "version
  packages" PR up to date; merging it tags `vX.Y.Z`, creates a GitHub Release
  with the changelog, and deploys the release.
- **`deploy.yml`** — builds the latest release's code with `main`'s posts (with
  `NEXT_PUBLIC_SITE_URL` set to the canonical domain) and publishes to GitHub
  Pages; called by the other two, or run by hand. See
  [`docs/runbook.md#deployment`](./docs/runbook.md#deployment).

## Deployment (GitHub Pages)

The site is a Next.js **static export** (`output: "export"`) deployed to GitHub
Pages from GitHub Actions. Routes use root-relative paths because the site is
served from a custom domain apex; the intermediate
`mimshins.github.io/sudo-overclock/` URL will not render correctly until the
custom domain is configured.

### One-time setup

1. **Enable Pages from Actions** Repository **Settings → Pages → Source: GitHub
   Actions**. Until this is set, the `deploy` job fails.

2. **Configure the custom domain** (once `sudo-overclock.space` is pointed at
   GitHub) Repository **Settings → Pages → Custom domain**: enter
   `sudo-overclock.space` and **Save**, then **Enforce HTTPS**.

   When publishing from a custom GitHub Actions workflow GitHub ignores a
   `CNAME` file, so the domain must be set here (there is intentionally no
   `CNAME` in the repo).

3. **Point DNS at GitHub Pages** at your DNS provider For the apex
   `sudo-overclock.space` add four `A` records (or an `ALIAS`/`ANAME`):

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

Sitemap, robots, RSS, `llms.txt`, and Open Graph URLs are rooted at `SITE_URL`
in `src/app/site.ts` (default `https://sudo-overclock.space`). The deploy
workflow sets `NEXT_PUBLIC_SITE_URL` explicitly; override it for any other host.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Architecture and module-boundary
rules are in [`docs/architecture.md`](./docs/architecture.md) and
[`AGENTS.md`](./AGENTS.md); component conventions are in
[`docs/components.md`](./docs/components.md).

## Requirements

- Node.js >= 24
- pnpm 10.22.0

## License

MIT - See [LICENSE](./LICENSE) for details.

Bundled font: [undefined medium](https://undefined-medium.com) by Andi Rueckel,
licensed under the SIL Open Font License 1.1. The font ships unmodified with its
license at
[`public/fonts/undefined-medium/OFL.txt`](./public/fonts/undefined-medium/OFL.txt).
The share-card renderer also reads build-only, unmodified upstream TTFs of
undefined medium and
[JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) Bold v2.304 (SIL
OFL 1.1, license at
[`src/app/fonts/jetbrains-mono-ofl.txt`](./src/app/fonts/jetbrains-mono-ofl.txt));
they are never served to readers.
