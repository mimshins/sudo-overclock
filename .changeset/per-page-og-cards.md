---
"sudo-overclock": minor
---

Give every page its own Open Graph and Twitter metadata (title, description,
canonical URL, `article` details for posts) and a build-time 1200×630 share card
at `<path>og.png`, drawn as phosphor dots from the page's background.
Tag links in pages, the sitemap, and `llms.txt` are now percent-encoded, so a
tag with a reserved character such as `#` keeps its URL intact.
