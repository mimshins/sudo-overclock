# Working memories

Committed, temporary context: investigations, hypotheses, open questions, and
in-flight work that must survive between sessions or tools. Not contracts and
not procedures. Local, throwaway task specs stay in `.ai/specs/` (gitignored).

Create one from
[`../../templates/working-memory.md`](../../templates/working-memory.md).

## Lifecycle

- **Resolve before the linked change lands:** promote the durable parts, then
  delete the file.
- Promote current behavior → `docs/`; accepted decisions → `decisions/`;
  proposals → `rfcs/active/`; durable agent context → `.ai/memories/`; reusable
  workflows → `.ai/skills/`.
- A working memory idle for **30 days** is promoted, updated, or deleted.
