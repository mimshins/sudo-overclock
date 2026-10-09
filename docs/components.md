# Component Documentation

How components are organised, how to build a new one, and what already exists.
For the authoritative architecture rules see
[`docs/architecture.md`](./architecture.md); [`AGENTS.md`](../AGENTS.md) is the
onboarding index.

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

| Component           | Props                                                                                                                    | Notes                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `Button`            | `variant: ghost\|outlined\|filled`, `color: neutral\|phosphor\|positive\|negative\|warn\|info`, `size: sm\|md\|lg`, `as` | Base UI button, polymorphic; `size` sets padding and type (sm caption, md/lg body) |
| `Heading`           | `size: h1…h6`, `variant: default\|muted\|phosphor`, `glow`                                                               | Polymorphic, defaults to `h2`                                                      |
| `Paragraph`         | `size: body1\|body2`, `variant: default\|muted`                                                                          | Body copy                                                                          |
| `Lead`              | `size: subheading1\|subheading2`, `variant: default\|muted\|phosphor`                                                    | Intro/standfirst paragraphs                                                        |
| `Caption`           | `variant: default\|muted`, `uppercase`                                                                                   | Small labels                                                                       |
| `Leader`            | `as` (default `div`; `h2` for section heads), `children` (label)                                                         | `──── label ────` ASCII section title                                              |
| `Tag`               | `active`, `onClick`                                                                                                      | Chip; a `<button>` with `aria-pressed` when `onClick` is set                       |
| `Kbd`               | `variant: default\|phosphor`                                                                                             | Keyboard key                                                                       |
| `InlineCode`        | `variant: default\|phosphor`                                                                                             | Inline code snippet                                                                |
| `CodeBlock`         | `language`, `filename`                                                                                                   | Framed `<pre>` with optional header chips                                          |
| `Blockquote`        | `cite`                                                                                                                   | Quote with a phosphor marker (`aria-hidden`) and nesting support                   |
| `List` / `ListItem` | `ordered`, `tight`, `as`                                                                                                 | `ul`/`ol` and `li` wrappers; both polymorphic                                      |
| `PhosphorField`     | `src`, `glowOnHover`                                                                                                     | Client canvas dot field (procedural or image)                                      |

All primitives are polymorphic where it makes sense and expose a
`data-slot="<name>"` hook.

### Blog components — `src/modules/blog/presentation/`

| Component         | Kind   | Role                                                                                                                    |
| ----------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| `PostList`        | server | Renders `PostSummary[]` as post cards; empty state included                                                             |
| `PostHeader`      | server | Post title block: slug leader, `h1`, date + reading time, description                                                   |
| `PostBody`        | server | Prose wrapper around the compiled post HTML                                                                             |
| `PostImages`      | client | Wraps post images in a skeleton frame + fade-in (progressive)                                                           |
| `TableOfContents` | client | TOC list with its own "on this page" caption + scroll-spy (`aria-current="location"`); renders nothing without headings |
| `PostFilter`      | client | Tag filter + sort toolbar for the blog index                                                                            |
| `CodeCopy`        | client | Adds `[ copy ]` → `[ copied ]` buttons to post code blocks; announces the copy in a polite live region                  |

`blog-module.ts` is the module's server-safe composition root. It wires the
compiled-content adapter into the application services and exports
`blogServices`, which server pages import directly at build time.

### App shell — `src/app/`

| Component     | Kind   | Role                                                                                     |
| ------------- | ------ | ---------------------------------------------------------------------------------------- |
| `SiteHeader`  | client | Brand, primary nav, responsive menu (Esc closes + refocus)                               |
| `SiteFooter`  | server | Copyright, ASCII tagline, social links                                                   |
| `LinkButton`  | client | `Button` rendered `as={Link}` (functions can't cross RSC)                                |
| `CoverImage`  | server | Book cover image for the reading list                                                    |
| `NotFound`    | server | 404 page (`not-found.tsx`); exported as `404.html`                                       |
| `SkipLink`    | server | "skip to content" link to `#main` (`data-slot="skip-link"`)                              |
| `ThemeToggle` | client | `[ light ]` toggle (`aria-pressed`); stores the choice, follows the OS until one is made |

### `Leader`

The ASCII section title from the design language. Renders `──── label ────`: two
rules of four U+2500 BOX DRAWINGS LIGHT HORIZONTAL characters around the label,
uppercase caption type, phosphor label, muted rules.

- **Slots:** `leader` (root), `leader-rule` (each rule, `aria-hidden`),
  `leader-label` (the label — the only text exposed to assistive tech).
- **Element:** a `div` above a page `h1`; `as="h2"` when it is the heading of a
  section (about and reading panels).
- **Styling:** local `--leader-size`, `--leader-font-weight`,
  `--leader-letter-spacing`, `--leader-label-color`, and `--leader-rule-color`;
  the rules drop letter-spacing so the box-drawing cells join into one line.

```tsx
<Leader>about.md</Leader>
<Leader as="h2">history</Leader>
```

### 404 page — `src/app/not-found.tsx`

Standard page pattern on `<main id="main">` with the global `.scanlines`
overlay: `Leader` (`404.log`) → `Heading as="h1" size="h1" glow` with the global
`.glitch-once` utility (one `@keyframes glitch` run on first render, neutralized
by the global reduced-motion rule) → a narrow column with:

- a block-letter `404` in a `<pre>` (phosphor, `.phosphor-glow`), wrapped in
  `role="img"` + `aria-label="404"` so it is announced once instead of glyph by
  glyph;
- terminal copy (`$ cd ./this-page` → `no such file or directory`), with the `$`
  prompt `aria-hidden`;
- `[ home ]` and `[ read the blog ]` as ghost phosphor `LinkButton`s.

Root `not-found.tsx` also handles unmatched URLs, and the static export writes
it to `out/404.html`. Next adds `noindex` to it automatically.

## Testing a component

Every component ships a `*.test.tsx` beside it (Vitest `ui` project, happy-dom,
React Testing Library — see
[`architecture.md#testing-strategy`](./architecture.md#testing-strategy)). Test
what a reader can observe: the element's role and accessible name, state exposed
through ARIA (`aria-pressed`, `aria-expanded`, `aria-current`), slots, and the
behavior of interactions. A variant or size whose effect is purely visual is
covered by the CSS-module contract test instead.

```tsx
render(<Tag onClick={onToggle}>go</Tag>);
await userEvent.setup().click(screen.getByRole("button", { name: "go" }));
expect(onToggle).toHaveBeenCalledOnce();
```

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

The site has a dark and a light (paper-CRT) theme: the boot script from
`src/app/theme.ts` sets `data-theme` before paint and `ThemeToggle` switches it.
Tokens live in `src/app/globals.css` (primitives and semantic roles in `:root`,
Tailwind names in `@theme inline`). The single accent is phosphor green
(`--color-phosphor`). Components consume semantic tokens; hex values belong in
`globals.css` only. The token inventory, patterns, and extension rules are in
[`design-system.md`](./design-system.md); props that currently have no effect
are listed under its _Known deviations_.
