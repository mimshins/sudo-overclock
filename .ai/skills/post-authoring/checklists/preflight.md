# Preflight Checklist

The `pnpm author:preflight <slug>` command covers the mechanical items marked
**[auto]**. Walk the rest by hand (or with the assistant).

## Frontmatter

- [ ] `title` present and descriptive. **[auto]**
- [ ] `date` present and ISO `YYYY-MM-DD`. **[auto]**
- [ ] `description` present, 50–160 chars. **[auto]**
- [ ] `tags` present and non-empty. **[auto]**
- [ ] `stage` is `ready`. **[auto]**
- [ ] No draft-only keys left behind. **[auto]**

## Body

- [ ] Body starts at `h2` (a leading `h1` is stripped at compile time).
      **[auto]**
- [ ] Every relative image path exists next to the post. **[auto]**
- [ ] Every fenced code block declares a language. **[auto]**
- [ ] Every image has non-empty alt text. **[auto]**
- [ ] Heading anchors do not collide after slugification (compiler suffixes
      duplicates; confirm that is acceptable). **[auto]**

## Uniqueness

- [ ] Slug does not collide with a published post in `content/raw/`. **[auto]**
- [ ] Slug does not collide with another draft. **[auto]** (self excluded)

## Content (human/assistant)

- [ ] Every factual claim is sourced or flagged.
- [ ] Every link resolves and points where it claims.
- [ ] Code samples are correct and runnable.
- [ ] Alt text describes the image's purpose, not "image".
- [ ] `description` reads well as a list excerpt and meta description.
- [ ] Tags are consistent with existing tags where sensible.
- [ ] Assets are final and reasonably sized.
