# Working Memory Template

Copy to `.ai/memories/working/<kebab-topic>.md` for in-flight context that must
survive between sessions. Resolve it before the linked change lands: promote the
durable parts, then delete the file. See `.ai/memories/working/README.md`.

```md
---
description: <what is being investigated or built>
status: active # active | blocked | ready-to-promote
related: <branch, issue, RFC, or spec>
created: YYYY-MM-DD
---

# <Title>

## Context

## Findings / hypotheses

## Open questions

## To promote on resolution

<!-- docs/ / ADR / RFC / memory / skill targets -->
```
