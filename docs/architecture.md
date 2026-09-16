# Architecture

Authoritative guide to sudo-overclock's structure, boundaries, and conventions.
`AGENTS.md` indexes it; this file holds the detail.

## Project Layout

The codebase follows a DDD-inspired, layered module structure. Every module has
the same internal shape so refactoring and module extraction stay predictable.

```
src/
  app/                  # Composition root (Next.js App Router routes)
                        # ONLY assembles pages from module presentation.
                        # No business logic, no direct module access.
  shared/               # Cross-cutting primitives, no domain knowledge
    ui/                 # Reusable, themable UI primitives (Button, Heading…)
                        #   Each in its own kebab-case folder with co-located
                        #   .module.css. NO barrel files.
    lib/                # Framework-agnostic helpers (polymorphic, DI context…)
  modules/
    <module-name>/
      domain/           # Pure types, value objects, domain events.
                        # No imports outside the module.
      application/      # Use cases, application services, ports.
                        #   ports/  — interfaces for adapters the module needs
                        #              from the outside (persistence, peers).
                        # May import shared/ + own domain/.
      infrastructure/   # Concrete adapters (compiler, file IO, peer bindings).
                        # May import shared/ + own domain/ + own application/.
      presentation/     # React components rendered by app/.
                        # May import shared/ + own application/ + own domain/.
                        # NEVER imports own infrastructure/ — gets it via DI.
      content/          # (Optional) module-owned resources:
                          content/raw/      — source markdown
                          content/compiled/ — generated TS
                          content/drafts/   — in-progress posts (excluded from build)
```

## Module Boundaries (DDD / Clean Architecture)

- **Inner layers never import outer layers.** `domain/` is the most inner,
  `presentation/` is the most outer. Cross-layer arrows point inward only.
- **Peer modules do NOT import each other directly.** Module A talks to Module B
  via B's `application/ports/` interface. B's `infrastructure/` provides the
  adapter. The composition root (`app/`) wires the actual implementation in.
- **Boundaries are enforced by `oxlint`'s `no-restricted-imports`** with a
  per-folder override. See `oxlint.config.ts`.

### Layer import rules

- `app/` is the composition root. It composes routes from
  `modules/*/presentation/` and may import from `@repo/shared/*`. It does NOT
  import `modules/*/domain/`, `application/`, or `infrastructure/` directly.
- `shared/` has no domain knowledge. It imports nothing from `modules/`.
- `modules/<x>/domain/` imports nothing outside the module.
- `modules/<x>/application/` may import `shared/` and own `domain/`. It may
  declare **ports** (TS interfaces) under `application/ports/` for any external
  dependency (persistence, peer modules, time, randomness).
- `modules/<x>/infrastructure/` provides the concrete adapters that satisfy the
  ports. It may import `shared/`, own `domain/`, own `application/`, and bind to
  peer modules through their `application/ports/` — never by reaching into a
  peer's `infrastructure/` or `presentation/`.
- `modules/<x>/presentation/` consumes application services (and
  context-injected adapters) to render React components. It NEVER imports its
  own `infrastructure/` directly — the composition root wires the adapter. The
  single exception is a `*-provider.tsx` / `*-module.ts` file (the module's
  composition root).
- `modules/<x>/content/` (when present) is owned by that module. Markdown goes
  in `content/raw/`, generated artifacts in `content/compiled/`, drafts in
  `content/drafts/`.

## Naming

- **Folders and component files use kebab-case.** A component lives in
  `shared/ui/<kebab-name>.tsx` with a co-located `<kebab-name>.module.css`. The
  flat layout keeps path aliases short (`@repo/shared/ui/button` resolves to a
  single file via a wildcard `paths` entry). Use a sub-folder only when the
  component has sub-files (e.g. multiple variants).
- **Component identifiers are PascalCase** in code (`Button`, `Heading`) even
  though the file is kebab-case (`button.tsx`).
- **No barrel files** (`index.ts`) except where an interface boundary actually
  needs one (e.g. a module's public API surface to other modules).
- **Aliases are scoped:**
  - `@repo/app/*` → `./src/app/*`
  - `@repo/shared/*` → `./src/shared/*`
  - `@repo/modules/*` → `./src/modules/*`
- **Inside a module, use relative imports** (`./types`, `../domain/post.ts`).
  This makes refactors and module extraction trivial — moving the folder keeps
  inner imports intact.
- **The `shared/` layer is the exception.** Files inside `src/shared/**` may
  only reference each other through aliases (`@repo/shared/lib/cx`,
  `@repo/shared/ui/button`). The internal `lib/` ↔ `ui/` boundary is treated as
  a cross-package reference: components always import helpers via the alias,
  never via `../lib/...`. This keeps `shared/` portable — extracting it into a
  separate package is mechanical.
- **Across module layers, use relative imports too** — never reach for an alias
  from inside a module. Cross-module references go through aliases.

## Dependency Injection

A small `shared/lib/create-context.ts` exports `createContext<T>()` that
produces a typed React context plus a `useContext` hook. Modules declare ports
(TS interfaces) in `application/ports.ts`; consumers in `presentation/` pull
implementations through context. The composition root in `app/` is the only
place that knows about concrete implementations.

## Content Pipeline

The project uses a two-stage content pipeline, owned by `modules/blog/`:

1. **Raw Content** (`modules/blog/content/raw/**/*.md`) — source markdown.
2. **Compiled Content** (`modules/blog/content/compiled/`) — structured,
   processed content ready for consumption.

The compiler lives at `modules/blog/infrastructure/compiler/` and uses
Unified.js, Rehype, and Remark plugins. It is invoked from a build-time script
(`scripts/compile.ts`) and writes to `modules/blog/content/compiled/`.
`pnpm build` runs `pnpm compile` via the `prebuild` hook.

Drafts live in `modules/blog/content/drafts/<slug>/` — a sibling of `raw/`. The
compiler globs only `raw/**`, so drafts are excluded from the build for free.
See [`docs/authoring.md`](./authoring.md) and
[`.ai/skills/post-authoring/pipeline.md`](../.ai/skills/post-authoring/pipeline.md).

Pipeline stages: `compile.ts` orchestrates; `pipeline.ts` runs remark-parse →
remark-gfm → remark-rehype → Shiki → assets → headings → rehype-stringify;
`reading-time.ts` estimates reading time; `headings.ts` adds anchors and TOC;
`assets.ts` resolves and rewrites images; `image-optimizer.ts` hashes and
encodes them; `concurrency.ts` bounds the CPU-bound work.

Two compiler-level details are worth knowing. **Shiki grammars load lazily**:
the highlighter starts with none, and each post's fences are scanned
(`collectFenceLanguages`) so only the languages it uses are loaded — cold start
and memory track the content, not the supported-language list. **Work is
bounded**: `withPipelineSlot` caps concurrent post compilations at
`availableParallelism()`, and `withEncodeSlot` caps image encodes at roughly
half the cores (independent limiters, so nesting cannot deadlock). Post
compilation is synchronous main-thread work, so it is bounded for memory, not
parallelized; image encoding is the CPU-heavy stage and is where concurrency
pays off.

## Assets and Code Blocks

**Images, fonts, and any binary asset** the markdown needs are co-located with
the post:

```
modules/blog/content/raw/
  hello-world/
    hello-world.md
    diagram.png
    hero.svg
  another-post/
    another-post.md
```

In markdown, reference them with relative paths:

```md
![diagram](./diagram.png)
```

The compiler resolves `./diagram.png` against the post's directory, prepares the
file into Next.js's `public/posts/<slug>/`, and rewrites the markup. Authors
never touch `public/` directly — the compiler owns that.

**Local raster images are content-addressed and optimized at build time**
(`infrastructure/compiler/image-optimizer.ts`):

- Each image is transcoded to **AVIF** (q55) and **WebP** (q80) with a fallback
  in its original format (JPEG q82, or PNG when the source has alpha); EXIF
  orientation is applied and images are downscaled to a **2048 px** maximum
  width (never upscaled).
- Variants are written as `<basename>.<hash>.<ext>`, where the hash is
  `sha256(source bytes + transform parameters)`. Hashing the **source**, not the
  encoded output, keeps filenames stable across machines and libvips versions.
- A local raster image becomes
  `<picture data-slot="post-picture"><source type="image/avif">…<source type="image/webp">…<img …></picture>`.
  The `<img>` carries intrinsic `width`/`height`, `loading="lazy"`,
  `decoding="async"`, and `data-slot="post-image"`.
- The three formats encode in parallel from one shared pipeline, and how many
  encodes run at once is derived from `os.availableParallelism()` (roughly half
  the cores, since libvips already multithreads a single operation).
  `SOC_IMAGE_CONCURRENCY` overrides it; see
  `infrastructure/compiler/concurrency.ts`.

The intrinsic dimensions reserve layout space so images are CLS-free **before
hydration and without JavaScript**; `PostImages` (a client component) wraps the
`<picture>` in a skeleton frame and fades the image in as pure progressive
enhancement. `picture { display: contents }` keeps the wrapper
layout-transparent.

**SVG** is copied with a hash but not transcoded; **animated** images are passed
through unchanged. External/root-relative images are left untouched. A file that
cannot be decoded or encoded is copied as-is under a hashed name, emitted as a
plain `<img>` without dimensions, and the compiler warns on stderr — the build
never fails for an image.

**Code blocks** are highlighted at build time by **Shiki**, with a custom theme
derived from our token palette (green-mono). Output is static HTML — zero
runtime JS for the highlight itself.

## Styling Strategy

- **Tailwind CSS** — used ONLY for design tokens and CSS variables, not for
  utility classes.
- **CSS Modules** — primary styling solution for components.
- **BaseUI** — component library for UI primitives.

### Token Naming

CSS custom properties follow Tailwind v4's token shape and live in the `@theme`
block in `src/app/globals.css`. The `--color-*`, `--font-*`, `--spacing-*`,
`--radius-*`, `--shadow-*` namespace mirrors Tailwind's utility API; primitive
hues use `--color-<hue>-<step>` (e.g. `--color-phosphor-500`).

There is no `--token-*` prefix. The token system itself is the single source of
truth.

Components in `shared/ui/**` and `modules/*/presentation/**` consume semantic
tokens directly via `var(--color-phosphor)` etc. Hex colors and ad-hoc values
belong in `globals.css` only.

### Component Conventions

- **Shared primitives live in `src/shared/ui/<kebab>.tsx`** with a co-located
  `<kebab>.module.css`. Module-scoped components live in
  `src/modules/<x>/presentation/`. App routes live in `src/app/`.
- Components reference **semantic tokens** (`--color-phosphor`,
  `--color-foreground`) in their CSS Modules. They never inline hex.
- Variant props (`variant="primary" | "ghost"`) map to CSS Module classes
  composed with **`clsx`**. Look up the existing `@base-ui/react` usage pattern
  in `shared/ui/button.tsx` for the template.
- **Variant and size classes override local CSS custom properties — they never
  duplicate property declarations.** The base class declares every property
  exactly once and consumes the local variables; each variant/size class only
  sets those variables. This keeps states (`:hover`, `:active`) and layout
  centralized so adding a new variant means setting a handful of variables, not
  re-declaring the whole rule set:

  ```css
  .heading {
    font-size: var(--heading-size);
    line-height: var(--heading-line-height);
    color: var(--heading-color);
  }

  .sizeH1 {
    --heading-size: var(--typography-h1-size);
    --heading-line-height: var(--typography-h1-leading);
  }

  .variantPhosphor {
    --heading-color: var(--color-phosphor);
  }
  ```

- **Every HTML layer that exposes a `className` hook carries a
  `data-slot="<name>"` attribute.** Selectors in CSS Modules use that attribute
  (e.g. `&[data-slot="leader"]`). Slots make it possible for consumers to reach
  in via global styles without descending into a component's internals.
- CSS Module imports return `string | undefined` per key (because of
  `noUncheckedIndexedAccess`). `clsx` accepts `undefined` directly, so **do
  not** defensively write `styles.foo ?? ""` — pass the value straight into
  `clsx(styles.foo, …)`.
- Button affordance text uses ASCII brackets: `[ read more ]`, `[ ok ]`.

## Static Generation

Next.js is configured for Static Site Generation (SSG). All blog content is
pre-rendered at build time.

## Circular Dependencies

The project uses oxlint's `import/no-cycle` rule to detect circular dependencies
as part of `pnpm check:lint`.

## Testing Strategy

- Unit tests for compiler logic.
- Integration tests for the content pipeline.
- Component tests for React components.
- No E2E tests (static site).

## Performance Considerations

- All content is pre-rendered (SSG).
- Local images carry intrinsic `width`/`height` (CLS-free), `loading="lazy"`,
  `decoding="async"`, and a skeleton placeholder until load. Responsive
  `srcset`/format conversion is future work.
- Code-split components where appropriate.
- Minimize client-side JavaScript.
