# Agent Instructions

This document provides context and guidelines for AI agents working on the
sudo-overclock project.

## Project Overview

This is an engineering blog built with modern web technologies. The architecture
separates content compilation from the application layer.

## Key Architectural Decisions

### Content Pipeline

The project uses a two-stage content pipeline:

1. **Raw Content** (`/content/raw/**/*.md`) - Source markdown files written by
   the author
2. **Compiled Content** (`/content/compiled`) - Structured, processed content
   ready for consumption

The `/compiler` module handles the transformation using Unified.js, Rehype, and
Remark plugins.

### Styling Strategy

- **Tailwind CSS** - Used ONLY for design tokens and CSS variables, not for
  utility classes
- **CSS Modules** - Primary styling solution for components
- **BaseUI** - Component library for UI primitives

### Static Generation

Next.js is configured for Static Site Generation (SSG). All blog content is
pre-rendered at build time.

## Development Guidelines

### Code Quality

- Run `pnpm check:lint` before committing to verify TypeScript types, ESLint
  rules, and formatting
- Run `pnpm test` to execute the test suite
- Use `pnpm format` to auto-fix formatting issues

### Module Boundaries

The project enforces strict module boundaries:

- `/app` should only import from `/compiler` and `/content/compiled`
- `/compiler` should be framework-agnostic (no Next.js or React dependencies)
- `/content/raw` contains only markdown files
- `/content/compiled` is generated and should not be manually edited

### Circular Dependencies

The project uses `madge` to detect circular dependencies. Run
`pnpm check:cycles` to verify.

## Common Tasks

### Adding a New Blog Post

1. Create a markdown file in `/content/raw/`
2. Run the compiler to generate structured content in `/content/compiled/`
3. The Next.js app will automatically pick up the new content during build

### Modifying the Compiler

1. Update logic in `/compiler`
2. Ensure changes don't break the contract with `/app`
3. Run tests and linting to verify

### Updating Components

1. Create or modify components in `/app`
2. Use CSS Modules for styling
3. Reference Tailwind tokens via CSS variables when needed

## Testing Strategy

- Unit tests for compiler logic
- Integration tests for content pipeline
- Component tests for React components
- No E2E tests (static site)

## Performance Considerations

- All content is pre-rendered (SSG)
- Optimize images during compilation
- Code-split components where appropriate
- Minimize client-side JavaScript
