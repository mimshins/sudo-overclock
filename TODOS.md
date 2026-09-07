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
  - [ ] Add file watching for development
  - [x] Integrate with build process (`prebuild`)
- [x] Write compiler tests
  - [x] Unit tests for individual plugins (slug, reading time)
  - [x] Integration tests for full pipeline
  - [x] Heading anchors + table of contents
  - [ ] Snapshot tests for output format

## Phase 3: Core Application

- [ ] Create layout components
  - [ ] Main layout with header/footer
  - [ ] Blog post layout
  - [ ] CSS Modules for each component
- [ ] Implement homepage
  - [ ] List all blog posts
  - [ ] Display post metadata (title, date, excerpt)
  - [ ] Add filtering/sorting functionality
- [ ] Implement blog post page
  - [ ] Dynamic route for `[slug]`
  - [ ] Render compiled markdown content
  - [ ] Add metadata (SEO, Open Graph)
  - [ ] Style prose content with CSS Modules
- [ ] Create shared components
  - [ ] Navigation component
  - [ ] Footer component
  - [ ] Post card component
  - [ ] Tag/category components

## Phase 4: Content Features

- [ ] Syntax highlighting
  - [ ] Configure code block styling
  - [ ] Add language-specific themes
  - [ ] Add copy-to-clipboard functionality
- [ ] Table of contents
  - [ ] Generate TOC from headings
  - [ ] Add smooth scroll navigation
  - [ ] Highlight active section
- [ ] Reading time estimation
  - [ ] Calculate during compilation
  - [ ] Display on post pages
- [ ] Tag/category system
  - [ ] Extract tags from frontmatter
  - [ ] Create tag index pages
  - [ ] Add tag filtering on homepage

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
  - [ ] Add performance monitoring
- [ ] Accessibility
  - [ ] Run accessibility audit
  - [ ] Fix ARIA labels and roles
  - [ ] Ensure keyboard navigation
  - [ ] Test with screen readers
- [ ] Dark mode
  - [ ] Implement theme toggle
  - [ ] Create dark mode color tokens
  - [ ] Update all components for dark mode

## Phase 6: Testing & Documentation

- [ ] Comprehensive testing
  - [ ] Achieve target code coverage
  - [ ] Add visual regression tests (optional)
  - [ ] Test on multiple browsers
- [ ] Documentation
  - [ ] Document content authoring workflow
  - [ ] Create component documentation
  - [ ] Add inline code comments
  - [ ] Update README with deployment instructions
- [ ] CI/CD setup
  - [ ] Set up GitHub Actions (or similar)
  - [ ] Automate linting and testing
  - [ ] Automate deployment

## Phase 7: Deployment

- [ ] Choose hosting platform (Vercel, Netlify, Cloudflare Pages, etc.)
- [ ] Configure deployment settings
- [ ] Set up custom domain
- [ ] Configure analytics (optional)
- [ ] Set up monitoring and error tracking

## Ongoing Maintenance

- [ ] Write first blog post
- [ ] Establish content publishing workflow
- [ ] Monitor performance metrics
- [ ] Gather feedback and iterate
