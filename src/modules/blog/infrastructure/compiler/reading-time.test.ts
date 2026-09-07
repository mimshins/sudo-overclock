import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { estimateReadingTimeMinutes } from "./reading-time.ts";

describe("estimateReadingTimeMinutes", () => {
  it("is floored at one minute", () => {
    assert.equal(estimateReadingTimeMinutes("just a few words"), 1);
  });

  it("counts words and divides by 200", () => {
    const words = Array.from({ length: 400 }, () => "word").join(" ");
    assert.equal(estimateReadingTimeMinutes(words), 2);
  });

  it("ignores fenced code blocks", () => {
    const code = "```ts\n" + "const x = 1;\n".repeat(500) + "```";
    assert.equal(estimateReadingTimeMinutes(code), 1);
  });
});
