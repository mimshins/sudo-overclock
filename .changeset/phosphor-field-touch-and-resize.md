---
"sudo-overclock": minor
---

Make the phosphor background cheaper and touch-aware. Resizing no longer
rebuilds the whole field. Bursts are coalesced, a container that only gets
shorter (a mobile toolbar sliding in) keeps its dots, and a real rebuild keeps
the surviving dots in place without replaying the pop-in. Background photos are
preloaded and decoded once per visit, so navigating back or switching theme
reuses them. On touch screens, where there is no hover, a slow phosphor swell
now rolls across the background instead.
