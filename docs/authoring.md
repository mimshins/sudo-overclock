# Content Authoring

How to write and publish a blog post on sudo-overclock.

## Writing pipeline

Writing is a staged, human-led process
([ADR-001](../decisions/ADR-001-ai-post-authoring-pipeline.md)). The author owns
voice, facts, and every final decision. Assistance — from a person or an AI tool
— drafts, gathers, and critiques; it proposes diffs and inline notes and never
rewrites the author's prose silently.

| #   | Stage         | Owner                     | Artifact                                     | Assistance                              |
| --- | ------------- | ------------------------- | -------------------------------------------- | --------------------------------------- |
| 0   | Seed          | Author                    | `post.md`                                    | none                                    |
| 1   | Brief         | Author seeds, AI expands  | `brief.md`                                   | expand into a tight brief               |
| 2   | Research pack | AI drafts, author curates | `research.md`                                | cheatsheet + checklist + open questions |
| 3   | Outline       | Author                    | `snapshots/outline-<date>.md`                | critique structure, flag gaps           |
| 4   | Draft         | Author                    | `post.md`                                    | none — the voice stays the author's     |
| 5   | Editorial     | Lead editor               | `snapshots/editorial-<date>.md` + `.diff.md` | structural → line → copy pass           |
| 6   | Resolve       | Author                    | `post.md`                                    | none                                    |
| 7   | Preflight     | Editor + CLI              | `snapshots/preflight-<date>.md`              | mechanical + content audit              |
| 8   | Publish       | Author                    | `content/raw/<slug>/`                        | none                                    |

`post.md` frontmatter `stage` values, in order: `seed` → `brief` → `research` →
`outline` → `draft` → `review` → `resolve` → `preflight` → `ready`.

### Gates

A stage is complete when its artifact exists and the next stage has what it
needs. Do not skip a gate.

- **0 → 1** `post.md` states the subject, audience, and a bullet-level intent.
- **1 → 2** `brief.md` has angle, takeaway, why-now, non-goals, target length.
- **2 → 3** `research.md` answers the brief's open questions with sources.
- **3 → 4** `snapshots/outline-*.md` has an `h2`/`h3` skeleton with per-section
  intent, and the critique is addressed.
- **4 → 5** `post.md` is a complete rough draft (start at `h2`).
- **5 → 6** `snapshots/editorial-*.diff.md` lists every proposed change with a
  rationale; the author resolves each in `post.md`.
- **6 → 7** `pnpm author:preflight <slug>` exits clean and the content audit is
  recorded in `snapshots/preflight-*.md`.
- **7 → 8** `pnpm author:publish <slug>` moves the post to `content/raw/`.

### Rules

- Only the author publishes. Nothing but `pnpm author:publish` writes to
  `content/raw/`, and nothing writes to `public/` or `content/compiled/` by
  hand.
- During editorial, `post.md` is never edited in place; changes arrive as a
  snapshot plus a diff.
- Facts and claims the author did not provide are flagged `[unverified]`, never
  asserted.
- Code fences always carry a language; images always carry alt text.

`pnpm author:new` scaffolds the workspace from the templates in
`src/modules/blog/infrastructure/authoring/templates/`. AI tools run the
assisted stages with the prompts in `.ai/skills/post-authoring/`; those prompts
implement this contract and never override it.

### Editorial standard

The editorial pass (stage 5) checks the draft against this standard.

Every editorial note carries one severity:

| Severity  | Meaning                                                              |
| --------- | -------------------------------------------------------------------- |
| `blocker` | Must be fixed before publishing (factual error, broken logic).       |
| `should`  | Clear improvement; the author should address or consciously decline. |
| `nit`     | Taste-level; optional.                                               |

#### Structural

- [ ] The draft delivers the brief's single takeaway.
- [ ] Section order supports the argument; no section is doing two jobs.
- [ ] No missing sections, no redundant ones.
- [ ] Headings form a clean `h2`/`h3` tree; the body starts at `h2`.

#### Line

- [ ] Hedges, filler, and throat-clearing removed.
- [ ] Sentences varied; no repeated scaffold ("In this section we…").
- [ ] The author's voice and idioms preserved.

#### Copy

- [ ] Grammar and punctuation correct.
- [ ] Terminology matches `research.md`'s glossary.
- [ ] Every code fence has a language; code is correct and runnable.
- [ ] Every image has meaningful alt text.
- [ ] Links resolve and point where they claim.

#### Facts

- [ ] Every factual claim traces to `research.md` or is flagged `[unverified]`.
- [ ] No invented benchmarks, statistics, quotes, or citations.

### Preflight checklist

The preflight (stage 7) is complete when every item passes.

The `pnpm author:preflight <slug>` command covers the mechanical items marked
**[auto]**. Walk the rest by hand (or with the assistant).

#### Frontmatter

- [ ] `title` present and descriptive. **[auto]**
- [ ] `date` present and ISO `YYYY-MM-DD`. **[auto]**
- [ ] `description` present, 50–160 chars. **[auto]**
- [ ] `tags` present and non-empty. **[auto]**
- [ ] `stage` is `ready`. **[auto]**
- [ ] No draft-only keys left behind. **[auto]**

#### Body

- [ ] Body starts at `h2` (a leading `h1` is stripped at compile time).
      **[auto]**
- [ ] Every relative image path exists next to the post. **[auto]**
- [ ] Every fenced code block declares a language. **[auto]**
- [ ] Every image has non-empty alt text. **[auto]**
- [ ] Heading anchors do not collide after slugification (compiler suffixes
      duplicates; confirm that is acceptable). **[auto]**

#### Uniqueness

- [ ] Slug does not collide with a published post in `content/raw/`. **[auto]**
- [ ] Slug does not collide with another draft. **[auto]** (self excluded)

#### Content (human/assistant)

- [ ] Every factual claim is sourced or flagged.
- [ ] Every link resolves and points where it claims.
- [ ] Code samples are correct and runnable.
- [ ] Alt text describes the image's purpose, not "image".
- [ ] `description` reads well as a list excerpt and meta description.
- [ ] Tags are consistent with existing tags where sensible.
- [ ] Assets are final and reasonably sized.

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

### Images

Always write meaningful **alt text**; `pnpm author:preflight` warns when it is
missing, and it is what screen readers announce.

```md
![A request flowing through the cache layer](./diagram.png)
```

The compiler optimizes each local image at build time: it transcodes to AVIF and
WebP with a same-format fallback, applies EXIF orientation, downscales to a 2048
px maximum width, and emits `width`, `height`, `loading="lazy"`, and
`decoding="async"` alongside a content-hashed `src`. The reserved
`width`/`height` box means images never cause cumulative layout shift, and the
post page shows a skeleton placeholder until each image loads. Because the URL
is hashed from the image's bytes, replacing a file automatically busts any cache
— just overwrite it and recompile. Prefer **local** assets: external
(`https://…`) and root-relative (`/…`) images are passed through untouched and
therefore get no optimization or reserved space.

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
- **Images** use relative paths and are optimized into `public/posts/<slug>/` as
  content-hashed AVIF/WebP/fallback variants; the compiler emits a `<picture>`
  whose `src` values are `/posts/<slug>/...`. External URLs, data URIs, and
  `/`-rooted paths are left untouched.
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

`pnpm build` runs `pnpm compile` first whenever the markdown, its assets, or the
compiler changed, and CI does the same, so generated content never needs to be
committed.

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
- `assets.ts` — relative image resolution, `<picture>`/`src` rewrite,
  dimensions.
- `image-optimizer.ts` — content hashing, EXIF rotate, resize, AVIF/WebP encode.

Draft scaffolding and validation live in
`src/modules/blog/infrastructure/authoring/`, invoked by `scripts/author/*.ts`.
