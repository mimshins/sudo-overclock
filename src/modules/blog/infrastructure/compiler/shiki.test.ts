import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getHighlighter,
  isSupportedLanguage,
  loadSupportedLanguages,
} from "./shiki.ts";

const highlighter = await getHighlighter();

describe("shiki lazy language loading", () => {
  it("knows which languages are supported", () => {
    assert.equal(isSupportedLanguage("typescript"), true);
    assert.equal(isSupportedLanguage("cobol"), false);
  });

  it("loads a supported language on demand", async () => {
    await loadSupportedLanguages(highlighter, ["go"]);
    assert.ok(highlighter.getLoadedLanguages().includes("go"));
  });

  it("silently skips unsupported languages", async () => {
    await loadSupportedLanguages(highlighter, ["cobol"]);
    assert.equal(highlighter.getLoadedLanguages().includes("cobol"), false);
  });
});
