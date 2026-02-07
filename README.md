# sudo-overclock

Engineering blog of @mimshins (Mostafa Shamsitabar).

## Tech Stack

- **React 19** - UI library
- **Next.js** - SSG framework
- **TypeScript** - Type safety
- **BaseUI** - Component library
- **Tailwind CSS** - Token/variable management
- **CSS Modules** - Primary styling solution
- **Unified.js + Rehype + Remark** - Markdown processing pipeline

## Project Structure

```
src/
├── app/          # Next.js application (blog website)
├── compiler/     # Markdown compilation logic
└── content/
    ├── raw/      # Source markdown files (*.md)
    └── compiled/ # Processed content for app consumption
```

### Architecture

The project follows a clear separation of concerns:

- **/app** - The Next.js blog application that renders the website
- **/compiler** - Compilation modules that transform raw markdown into
  structured data
- **/content/raw** - Source markdown files for blog posts
- **/content/compiled** - Generated structured content consumed by the app

The compiler processes markdown files from `/content/raw/**/*.md` and outputs
structured, compiled content to `/content/compiled` for the Next.js app to use
during static generation.

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Lint and type-check
pnpm check:lint

# Format code
pnpm format
```

## Requirements

- Node.js >= 24
- pnpm 10.22.0

## License

MIT - See [LICENSE](./LICENSE) for details.
