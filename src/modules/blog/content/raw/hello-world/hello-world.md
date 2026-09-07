---
title: "Hello, Overclock"
date: "2026-02-07"
description:
  "The first post. A tour of the blog's architecture and what to expect."
tags:
  - meta
  - architecture
author: "Mostafa Shamsitabar"
---

# Hello, Overclock

Welcome to the first post. This blog is an engineering log — a place to write
about systems, compilers, and the craft of building software.

## What this site is

A static blog with a build-time content pipeline:

1. Markdown lives in `content/raw/`.
2. A compiler turns it into structured, highlighted HTML.
3. Next.js renders it as static pages.

## A code sample

```ts
type Post = {
  readonly slug: string;
  readonly body: string;
};

const render = (post: Post): string => `<article>${post.body}</article>`;
```

## A table

| Feature             | Status |
| ------------------- | ------ |
| SSG                 | done   |
| Syntax highlighting | done   |

That's it for now. `[ read more ]` later.
