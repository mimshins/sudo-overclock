# Project TODOs

Step-by-step implementation plan for the sudo-overclock engineering blog.

## Phase 1: Foundation Setup

- [x] Configure Tailwind CSS for token/variable management only
  - [x] Set up `tailwind` with design tokens
  - [x] Create CSS variables from Tailwind tokens
  - [x] Disable utility class generation
- [x] Configure Next.js for SSG
  - [x] Set up `next.config.js` with static export settings
  - [x] Configure TypeScript paths for clean imports
  - [x] Set up app directory structure
- [x] Set up BaseUI
  - [x] Install and configure BaseUI
  - [x] Create base component wrappers if needed
  - [x] Set up theming integration with Tailwind tokens

## Phase 2: Content Compiler

- [x] Design content schema
  - [x] Define frontmatter structure (title, date, tags, etc.)
  - [x] Define compiled output format (JSON/TypeScript types)
  - [x] Create TypeScript interfaces for content types
- [x] Implement markdown compiler
  - [x] Set up Unified.js pipeline
  - [x] Configure Remark plugins (parsing, frontmatter extraction)
  - [x] Configure Rehype plugins (HTML transformation, syntax highlighting)
  - [x] Add custom plugins as needed (reading time, heading anchors, TOC)
- [x] Create compiler CLI/script
  - [x] Build script to process `/content/raw/**/*.md`
  - [x] Output structured data to `/content/compiled`
  - [x] Integrate with build process (`prebuild`)
- [x] Write compiler tests
  - [x] Unit tests for individual plugins (slug, reading time)
  - [x] Integration tests for full pipeline
  - [x] Heading anchors + table of contents

## Phase 3: Core Application

- [x] Create layout components
  - [x] Main layout with header/footer
  - [x] Blog post layout
  - [x] CSS Modules for each component
- [x] Implement homepage
  - [x] List all blog posts (blog index at `/blog`)
  - [x] Display post metadata (title, date, excerpt)
  - [x] Add filtering/sorting functionality
- [x] Implement blog post page
  - [x] Dynamic route for `[slug]` (`/blog/posts/[slug]`)
  - [x] Render compiled markdown content
  - [x] Add metadata (SEO, Open Graph)
  - [x] Style prose content with CSS Modules
- [x] Create shared components
  - [x] Navigation component (site header)
  - [x] Footer component
  - [x] Post card component (post list)
  - [x] Tag/category components
- [x] Additional pages
  - [x] `/blog` index
  - [x] `/about` bio + current role + history
  - [x] `/reading` technical reading list
  - [x] `/` landing with interactive phosphor field
- [x] Interactive dot-field (`PhosphorField`)
  - [x] Extract into `shared/ui` (core / render / hover / reveal / image /
        session)
  - [x] Procedural mode (home) with hover glow + drift
  - [x] Image pointillism mode for blog/about/reading backgrounds
  - [x] Random pop-in reveal + drift, no hover glow (blog/about/reading)
  - [x] Reduced-motion safe

## Phase 4: Content Features

- [x] Syntax highlighting
  - [x] Configure code block styling
  - [ ] Add language-specific themes (green-mono is the single deliberate theme)
  - [x] Add copy-to-clipboard functionality
- [x] Table of contents
  - [x] Generate TOC from headings
  - [x] Add smooth scroll navigation
  - [x] Highlight active section
- [x] Reading time estimation
  - [x] Calculate during compilation
  - [x] Display on post pages
- [x] Tag/category system
  - [x] Extract tags from frontmatter
  - [x] Create tag index pages
  - [x] Add tag filtering on blog index

## Phase 5: Polish & Optimization

- [x] Responsive layout
  - [x] Audit large desktop / wide-viewport canvases (dot-field perf + layout)
  - [x] Tablet breakpoints (panels, book rows, header/footer)
  - [x] Mobile breakpoints (stack covers, cards, nav)
  - [x] Touch/no-hover behavior for the dot fields
  - note: initial pass — no horizontal overflow at 390/768/1280 across all
    routes; small-screen padding/gap pass done
- [x] SEO optimization
  - [x] Add sitemap generation
  - [x] Configure robots.txt
  - [x] Add RSS feed
  - [x] Optimize meta tags (OG/Twitter defaults + per page)
- [x] Performance optimization
  - [x] Optimize images — mosaic backgrounds re-encoded to JPEG (~5MB → ~1.2MB
        total); book covers already small + lazy-loaded
  - [x] Code splitting analysis — React/BaseUI framework chunks dominate;
        per-route app chunks are small (~12–16KB)
  - [x] Minimize bundle size (see analysis; revisit if routes grow heavy)
- [x] Accessibility
  - [x] Run accessibility audit (axe-core across all routes)
  - [x] Fix ARIA labels and roles (skip link, burger `aria-expanded`/controls,
        footer contrast fix)
  - [x] Ensure keyboard navigation (skip-to-content, menu closes on Esc with
        focus return to the trigger)
  - note: 0 axe violations across all routes
- [x] Theme: dark mode only (chosen)
  - [x] Dark color tokens
  - [x] Theme toggle intentionally dropped — boot script pins
        `data-theme="dark"` regardless of system preference

## Phase 6: Documentation & CI/CD

- [x] Documentation
  - [x] Document content authoring workflow — `docs/authoring.md`
  - [x] Create component documentation — `docs/components.md`
  - [x] Add inline code comments — file-level docs across compiler +
        presentation; filled gaps in the app shell
  - [x] Update README with deployment instructions
- [x] CI/CD setup
  - [x] Set up GitHub Actions — `.github/workflows/ci.yml` (lint + test + build)
        and `deploy.yml` (Pages deploy on `main`)
  - [x] Automate code static analysis — `pnpm check:lint` (oxlint + oxfmt) in CI
  - [x] Automate deployment — `actions/deploy-pages` on every `main` push

## Phase 7: Deployment

- [x] Choose hosting platform — GitHub Pages (Next.js static export to `out/`)
- [x] Configure deployment settings
  - deploy workflow sets `NEXT_PUBLIC_SITE_URL=https://sudo-overclock.com`;
    build uses root-relative paths for the custom-domain apex
  - manual one-time step: repo **Settings → Pages → Source: GitHub Actions**
- [x] Set up custom domain — `sudo-overclock.com`
  - GitHub ignores `CNAME` files for Actions-based Pages; the domain must be set
    in **Settings → Pages → Custom domain**
  - manual step: DNS apex `A` records → `185.199.108–111.153` (see README);
    optional `www` CNAME → `mimshins.github.io`; then Enforce HTTPS

## Ongoing Maintenance

- [ ] Write first real blog post
- [ ] Establish content publishing workflow
- [ ] Monitor performance metrics
- [ ] Gather feedback and iterate
