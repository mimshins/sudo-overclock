import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { describe, it } from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const CSS_MODULE_STUB =
  "export default new Proxy({}, { get: (_, key) => String(key) });";

registerHooks({
  load: (url, context, nextLoad) =>
    url.endsWith(".css")
      ? { format: "module", shortCircuit: true, source: CSS_MODULE_STUB }
      : nextLoad(url, context),
});

const { LEADER_RULE, Leader } = await import("./leader.tsx");

const render = (element: Parameters<typeof renderToStaticMarkup>[0]) =>
  renderToStaticMarkup(element);

describe("Leader", () => {
  it("uses four U+2500 box-drawing characters per rule", () => {
    assert.equal(LEADER_RULE, "────");
  });

  it("renders the label between two aria-hidden rules", () => {
    const html = render(createElement(Leader, null, "about.md"));

    assert.equal(
      html,
      '<div class="leader" data-slot="leader">' +
        `<span class="rule" data-slot="leader-rule" aria-hidden="true">${LEADER_RULE}</span>` +
        '<span class="label" data-slot="leader-label">about.md</span>' +
        `<span class="rule" data-slot="leader-rule" aria-hidden="true">${LEADER_RULE}</span>` +
        "</div>",
    );
  });

  it("renders as the requested element and merges className", () => {
    const html = render(
      createElement(Leader, { as: "h2", className: "extra", id: "now" }, "now"),
    );

    assert.match(
      html,
      /^<h2 class="leader extra" data-slot="leader" id="now">/u,
    );
    assert.match(html, /<\/h2>$/u);
  });

  it("keeps only the label in the accessible text", () => {
    const html = render(createElement(Leader, null, "blog.md"));
    const visibleToAt = html.replaceAll(
      /<span[^>]*aria-hidden="true"[^>]*>[^<]*<\/span>/gu,
      "",
    );

    assert.equal(visibleToAt.replaceAll(/<[^>]+>/gu, ""), "blog.md");
  });
});
