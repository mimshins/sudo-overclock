# Content Authoring

How to write and publish a blog post on sudo-overclock.

## Writing pipeline

Writing is a staged, human-led, AI-assisted process — seed → brief → research →
outline → draft → editorial → resolve → preflight → publish. It is defined in
[`.ai/skills/post-authoring/pipeline.md`](../.ai/skills/post-authoring/pipeline.md),
with per-stage prompts under `.ai/skills/post-authoring/stages/` and templates
under `.ai/templates/`.

The rest of this document covers the publishing mechanics: where files live,
frontmatter, markdown rules, and the commands that build and ship a post.

## Where posts live

Source markdown lives in `src/modules/blog/content/raw/`. Give every post its
own directory so images can sit next to the markdown:

```
src/modules/blog/content/raw/
  hello-world/
    hello-world.md
    diagram.png
  my-next-post/
    my-next-post.md
    hero.svg
```

In-progress posts live in the sibling `src/modules/blog/content/drafts/<slug>/`
directory:

```
src/modules/blog/content/drafts/my-next-post/
  post.md        # the draft; frontmatter `stage` tracks progress
  brief.md       # stage-1 reference
  research.md    # stage-2 reference
  snapshots/     # frozen outline/editorial/preflight gates
  assets/        # co-located images
```

The compiler globs `content/raw/**` only, so drafts never reach the build.
Publishing moves `post.md` and `assets/` out of `drafts/` and into `raw/`.

Assets are resolved against the post's directory, so a post referenced as
`![diagram](./diagram.png)` inside `my-next-post/` finds
`my-next-post/diagram.png`. Never touch `public/` or
`src/modules/blog/content/compiled/` by hand — both are generated.

## Frontmatter

Frontmatter is YAML between `---` fences at the top of the file. Supported
fields:

| Field         | Required | Notes                                                               |
| ------------- | -------- | ------------------------------------------------------------------- |
| `title`       | yes      | Page `<title>` and list/header display name.                        |
| `date`        | yes      | ISO date, `YYYY-MM-DD`. Drives sort order and sitemap.              |
| `description` | no\*     | Meta description, list excerpt. \*Required by `author:preflight`.   |
| `tags`        | no       | YAML list (`- go\n- distributed-systems`) or a single string.       |
| `author`      | no       | Defaults to the site author.                                        |
| `slug`        | no       | URL slug override. Defaults to the file's base name.                |
| `stage`       | drafts   | Pipeline stage; stripped on publish. Not a built-in compiler field. |

```md
---
title: "My Next Post"
date: "2026-03-15"
description: "A few sentences for the blog index and search engines."
tags:
  - systems
  - distributed-systems
---
```

Slugs are derived from the `slug` field, falling back to the file name, and
lower-cased with runs of non-alphanumerics collapsed to `-`
(`src/modules/blog/infrastructure/compiler/slug.ts`).

## Markdown body rules

- **Start at `h2`.** A single leading `h1` is stripped from the rendered body
  (the page already renders the title as its only `h1`).
- **Headings** (`h2`–`h6`) get an anchor `id`, a `#` permalink, and appear in
  the table of contents. Duplicate headings get a numeric suffix
  (`introduction`, `introduction-1`).
- **Code fences** are highlighted at build time by Shiki using the single
  green-mono theme. Language is optional but recommended; common aliases map to
  canonical Shiki ids (`ts`→typescript, `sh`/`shell`→bash, `py`→python,
  `js`→javascript, etc.). Every block gets a copy-to-clipboard button.
- **GFM is enabled**: tables, task lists, footnotes not included, nested lists,
  and autolinks.
- **Images** use relative paths and are copied to `public/posts/<slug>/` with
  their `src` rewritten to `/posts/<slug>/...` by the compiler. External URLs,
  data URIs, and `/`-rooted paths are left untouched.
- **Blockquotes** render with the phosphor rail styling; nesting is supported.

## Local workflow

```bash
# 1. Scaffold a draft, write, and stage it
pnpm author:new my-next-post

# 2. Validate, then publish (moves it to content/raw/)
pnpm author:preflight my-next-post
pnpm author:publish my-next-post

# 3. Compile raw markdown -> compiled content (public/posts + content/compiled)
pnpm compile

# 4. Preview
pnpm dev
```

`pnpm build` runs `pnpm compile` automatically via the `prebuild` hook, and CI
does the same, so generated content never needs to be committed.

## Publishing

Push to `main`. The `ci` workflow lints/tests/builds every push and PR; the
`deploy` workflow builds and deploys the static export to GitHub Pages on every
`main` push. A commit to `main` is a deploy.

## Pipeline reference

Compilation is orchestrated by `src/modules/blog/infrastructure/compiler/`:

- `compile.ts` — walks `raw/**`, writes `compiled/index.ts`, copies assets.
- `pipeline.ts` — remark-parse → remark-gfm → remark-rehype → Shiki → assets →
  headings → rehype-stringify.
- `reading-time.ts` — reading-time estimation stored on each post.
- `headings.ts` — heading anchors, permalinks, and TOC extraction.
- `assets.ts` — relative image copy and `src` rewrite.

Draft scaffolding and validation live in
`src/modules/blog/infrastructure/authoring/`, invoked by `scripts/author/*.ts`.
