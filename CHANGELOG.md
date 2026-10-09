# sudo-overclock

## 0.2.0

### Minor Changes

- [`708a156`](https://github.com/mimshins/sudo-overclock/commit/708a15658b2cdd345fe1d55eea90b1ef726d649e) Thanks [@mimshins](https://github.com/mimshins)! - Add a CRT 404 page (ASCII art, scanlines, one-shot glitch), draw page and
  section leaders with box-drawing rules through a shared `Leader` primitive, and
  move the root font size to the browser default (16px) so rem tokens render at
  their intended sizes.

- [`76336d5`](https://github.com/mimshins/sudo-overclock/commit/76336d57ea92c5bef89ace7551bf04d6dff1c60f) Thanks [@mimshins](https://github.com/mimshins)! - Show what is live: the footer, the feed's generator, and `llms.txt` carry the
  released code version and the commit the posts were built from.

- [`422476e`](https://github.com/mimshins/sudo-overclock/commit/422476eb869e0046baf380a0ce623ee094cd89e4) Thanks [@mimshins](https://github.com/mimshins)! - Add the paper-CRT light theme: ink on green-bar paper (with banded code
  listings), a `[ light ]` toggle in
  the header that follows your OS until you choose, inverse-video text
  selection, and backgrounds drawn as ink dots on paper. Also fixes invisible
  text on filled neutral buttons and low-contrast diff colors in code blocks,
  and keeps the background field still under reduced motion.

### Patch Changes

- [`564a904`](https://github.com/mimshins/sudo-overclock/commit/564a90481ee54f643ddbd36a9aa2998186c1df65) Thanks [@mimshins](https://github.com/mimshins)! - Make the blog UI speak its state to assistive tech: the home calls to action
  are named by their visible text (`[ read the blog ]`, `[ who am i ]`) instead of
  two identical "read more" labels; the blog sort toggle is named by its visible
  order (`[ newest ]` / `[ oldest ]`) instead of a stateless "toggle sort order";
  a successful code copy is announced through a polite live region and the copy
  button is named by its visible label; and the "on this page" caption no longer
  renders for posts without headings.

- [`564a904`](https://github.com/mimshins/sudo-overclock/commit/564a90481ee54f643ddbd36a9aa2998186c1df65) Thanks [@mimshins](https://github.com/mimshins)! - Make shared primitives do what their props say: button sizes now set padding
  and type (buttons gain a small padded hit area), `Lead` sizes apply,
  `Caption uppercase={false}` turns off uppercase, `ListItem` honors `as`,
  clickable tags expose `aria-pressed`, and the blockquote marker is hidden from
  screen readers.
