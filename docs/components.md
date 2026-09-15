# Component Documentation

How components are organised, how to build a new one, and what already exists.
For the authoritative architecture rules see [`AGENTS.md`](../AGENTS.md).

## Three layers

| Layer             | Location                         | Role                                                  |
| ----------------- | -------------------------------- | ----------------------------------------------------- |
| Shared primitives | `src/shared/ui/`                 | Generic, themable, domain-free building blocks        |
| Module components | `src/modules/blog/presentation/` | Blog-specific, render application/domain data         |
| App shell         | `src/app/`                       | Routes + global chrome (header, footer, link helpers) |

Dependency direction points inward: `app/` → module presentation → module
application → domain. `shared/` never imports from `modules/`; module
presentation never imports its own `infrastructure/` (it receives adapters via
context/DI wired in `app/`).

## Existing components

### Shared primitives — `src/shared/ui/`

| Component           | Props                                                                                                                    | Notes                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `Button`            | `variant: ghost\|outlined\|filled`, `color: neutral\|phosphor\|positive\|negative\|warn\|info`, `size: sm\|md\|lg`, `as` | Base UI button, polymorphic                    |
| `Heading`           | `size: h1…h6`, `variant: default\|muted\|phosphor`, `glow`                                                               | Polymorphic, defaults to `h2`                  |
| `Paragraph`         | `size: body1\|body2`, `variant: default\|muted`                                                                          | Body copy                                      |
| `Lead`              | `size: subheading1\|subheading2`, `variant: default\|muted\|phosphor`                                                    | Intro/standfirst paragraphs                    |
| `Caption`           | `variant: default\|muted`, `uppercase`                                                                                   | Small labels                                   |
| `Tag`               | `active`, `onClick`                                                                                                      | Chip; renders `<button>` when `onClick` is set |
| `Kbd`               | `variant: default\|phosphor`                                                                                             | Keyboard key                                   |
| `InlineCode`        | `variant: default\|phosphor`                                                                                             | Inline code snippet                            |
| `CodeBlock`         | `language`, `filename`                                                                                                   | Framed `<pre>` with optional header chips      |
| `Blockquote`        | `cite`                                                                                                                   | Quote with phosphor marker and nesting support |
| `List` / `ListItem` | `ordered`, `tight`                                                                                                       | `ul`/`ol` and `li` wrappers                    |
| `PhosphorField`     | `src`, `glowOnHover`                                                                                                     | Client canvas dot field (procedural or image)  |

All primitives are polymorphic where it makes sense and expose a
`data-slot="<name>"` hook.

### Blog components — `src/modules/blog/presentation/`

| Component         | Kind   | Role                                                                  |
| ----------------- | ------ | --------------------------------------------------------------------- |
| `PostList`        | server | Renders `PostSummary[]` as post cards; empty state included           |
| `PostHeader`      | server | Post title block: slug leader, `h1`, date + reading time, description |
| `PostBody`        | server | Prose wrapper around the compiled post HTML                           |
| `TableOfContents` | client | TOC list + scroll-spy active-section highlight                        |
| `PostFilter`      | client | Tag filter + sort toolbar for the blog index                          |
| `CodeCopy`        | client | Mounts copy-to-clipboard buttons on rendered Shiki blocks             |

`blog-module.ts` is the module's server-safe composition root. It wires the
compiled-content adapter into the application services and exports
`blogServices`, which server pages import directly at build time.

### App shell — `src/app/`

| Component    | Kind   | Role                                                       |
| ------------ | ------ | ---------------------------------------------------------- |
| `SiteHeader` | client | Brand, primary nav, responsive menu (Esc closes + refocus) |
| `SiteFooter` | server | Copyright, ASCII tagline, social links                     |
| `LinkButton` | client | `Button` rendered `as={Link}` (functions can't cross RSC)  |
| `CoverImage` | server | Book cover image for the reading list                      |

## Building a component

1. **Pick the layer.** Shared if it is generic; module presentation if it knows
   about blog data; app if it is route/global chrome.
2. **File naming.** `kebab-case.tsx` with a co-located `kebab-case.module.css`;
   the exported identifier is `PascalCase`. No barrel files.
3. **Add a `data-slot`** to every HTML layer that should be reachable from
   global CSS.
4. **Style with tokens.** Reference semantic tokens (`var(--color-phosphor)`,
   `var(--color-foreground)`) in the CSS Module — never inline hex. All spacing
   is a multiple of `var(--spacing)`.
5. **Variants set CSS variables, they don't duplicate declarations.** The base
   class declares each property once and consumes local variables; size and
   variant classes only set those variables:

   ```css
   .heading {
     font-size: var(--heading-size);
     color: var(--heading-color);
   }
   .sizeH1 {
     --heading-size: var(--typography-h1-size);
   }
   .variantPhosphor {
     --heading-color: var(--color-phosphor);
   }
   ```

6. **Compose classes with `cx`** from `@repo/shared/lib/cx`. CSS Module keys are
   `string | undefined` under `noUncheckedIndexedAccess`; pass them straight to
   `cx` rather than coalescing.
7. **Mark client components.** Add `"use client"` only when the component needs
   state, effects, or event handlers. Keep data-fetching in server components
   and pass props down.
8. **Motion is snap and respects `prefers-reduced-motion`** (handled globally in
   `globals.css`).

## Theming

The site is dark-only: an inline boot script in `src/app/layout.tsx` pins
`data-theme="dark"` before paint. Tokens live in the `@theme` block of
`src/app/globals.css` following Tailwind v4's `--color-*`, `--font-*`,
`--spacing-*`, `--radius-*`, `--shadow-*` namespaces. The single accent is
phosphor green (`--color-phosphor`). Components consume tokens directly; hex
values belong in `globals.css` only.
