# Post Authoring Pipeline

A human-led, AI-assisted pipeline for writing and publishing a post on
sudo-overclock. The author owns voice, facts, and every final decision. The
assistant drafts, gathers, and critiques — it **proposes diffs and inline notes,
never silent rewrites**.

## Stages

| #   | Stage         | Owner                    | Artifact                                     | Assistant role                          |
| --- | ------------- | ------------------------ | -------------------------------------------- | --------------------------------------- |
| 0   | Seed          | Human                    | `post.md`                                    | none                                    |
| 1   | Brief         | Human seeds, AI expands  | `brief.md`                                   | expand into a tight brief               |
| 2   | Research pack | AI drafts, human curates | `research.md`                                | cheatsheet + checklist + open questions |
| 3   | Outline       | Human                    | `snapshots/outline-<date>.md`                | critique structure, flag gaps           |
| 4   | Draft         | Human                    | `post.md`                                    | none — voice stays the author's         |
| 5   | Editorial     | AI as lead editor        | `snapshots/editorial-<date>.md` + `.diff.md` | structural → line → copy pass           |
| 6   | Resolve       | Human                    | `post.md`                                    | none                                    |
| 7   | Preflight     | AI + CLI                 | `snapshots/preflight-<date>.md`              | mechanical + content audit              |
| 8   | Publish       | Human                    | `content/raw/<slug>/`                        | none                                    |

## Workspace

```
src/modules/blog/content/drafts/<slug>/
  post.md                 # The evolving draft. Its `stage:` frontmatter drives the pipeline.
  brief.md                # Persistent stage-1 reference.
  research.md             # Persistent stage-2 reference.
  snapshots/              # Frozen gates: outline-, editorial-, preflight-<date>.md
  assets/                 # Co-located images, moved to raw/ on publish.
```

`post.md` frontmatter `stage` values, in order:

`seed` → `brief` → `research` → `outline` → `draft` → `review` → `resolve` →
`preflight` → `ready`

## Gates

A stage is complete when its artifact exists and the next stage has what it
needs. Do not skip a gate.

- **0 → 1** `post.md` states the subject, audience, and a bullet-level intent.
- **1 → 2** `brief.md` has angle, takeaway, why-now, non-goals, target length.
- **2 → 3** `research.md` answers the brief's open questions with sources.
- **3 → 4** `snapshots/outline-*.md` has an `h2`/`h3` skeleton with per-section
  intent and the assistant's critique addressed.
- **4 → 5** `post.md` is a complete rough draft (start at `h2`).
- **5 → 6** `snapshots/editorial-*.diff.md` lists every proposed change with a
  rationale; the author resolves each in `post.md`.
- **6 → 7** `pnpm author:preflight <slug>` exits clean and the content audit is
  recorded in `snapshots/preflight-*.md`.
- **7 → 8** `pnpm author:publish <slug>` moves the post to `content/raw/`.

## Running a stage

Load the matching prompt and follow it exactly:

- Brief → [`stages/brief.md`](./stages/brief.md)
- Research → [`stages/research.md`](./stages/research.md)
- Outline critique →
  [`stages/outline-critique.md`](./stages/outline-critique.md)
- Editorial → [`stages/editorial.md`](./stages/editorial.md)
- Preflight → [`stages/preflight.md`](./stages/preflight.md)

## Guardrails

- The assistant never writes to `content/raw/` or `public/` — publishing is a
  human-run command.
- The assistant never edits `post.md` in place during the editorial stage; it
  writes a snapshot and a diff.
- Facts and claims the author did not provide must be flagged as `[unverified]`,
  never asserted.
- Code fences always carry a language; images always carry alt text.
