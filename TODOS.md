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
  - [x] Post card component (post list)
  - [x] Tag/category components
- [x] Additional pages
  - [x] `/blog` index
  - [x] `/about` bio + resume (stub)
  - [x] `/reading` reading list (stub)
  - [x] `/` home (stub)

## Phase 4: Content Features

- [x] Syntax highlighting
  - [x] Configure code block styling
  - [ ] Add language-specific themes
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
  - [x] Add tag filtering on homepage

## Phase 5: Polish & Optimization

- [ ] SEO optimization
  - [ ] Add sitemap generation
  - [ ] Configure robots.txt
  - [ ] Add RSS feed
  - [ ] Optimize meta tags
- [ ] Performance optimization
  - [ ] Optimize images (next/image or custom solution)
  - [ ] Code splitting analysis
  - [ ] Minimize bundle size
- [ ] Accessibility
  - [ ] Run accessibility audit
  - [ ] Fix ARIA labels and roles
  - [ ] Ensure keyboard navigation
- [ ] Dark mode
  - [ ] Implement theme toggle
  - [ ] Create dark mode color tokens
  - [ ] Update all components for dark mode

## Phase 6: Documentation & CI/CD

- [ ] Documentation
  - [ ] Document content authoring workflow
  - [ ] Create component documentation
  - [ ] Add inline code comments
  - [ ] Update README with deployment instructions
- [ ] CI/CD setup
  - [ ] Set up GitHub Actions (or similar)
  - [ ] Automate code static analysis
  - [ ] Automate deployment

## Phase 7: Deployment

- [ ] Choose hosting platform (Vercel, Netlify, Cloudflare Pages, etc.)
- [ ] Configure deployment settings
- [ ] Set up custom domain

## Ongoing Maintenance

- [ ] Write first blog post
- [ ] Establish content publishing workflow
- [ ] Monitor performance metrics
- [ ] Gather feedback and iterate
