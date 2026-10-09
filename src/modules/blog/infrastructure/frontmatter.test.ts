import { describe, expect, it } from "vitest";

import { parseFrontmatter, stringifyFrontmatter } from "./frontmatter.ts";

describe("parseFrontmatter", () => {
  it("splits the YAML block from the body", () => {
    expect(
      parseFrontmatter('---\ntitle: "Hello"\ntags: [a, b]\n---\n# Body\n'),
    ).toStrictEqual({
      data: { title: "Hello", tags: ["a", "b"] },
      content: "# Body\n",
    });
  });

  it("keeps unquoted dates as strings", () => {
    expect(parseFrontmatter("---\ndate: 2026-02-07\n---\n").data).toStrictEqual(
      { date: "2026-02-07" },
    );
  });

  it("accepts CRLF line endings", () => {
    expect(parseFrontmatter("---\r\ntitle: x\r\n---\r\nbody")).toStrictEqual({
      data: { title: "x" },
      content: "body",
    });
  });

  it("treats an empty block as no data", () => {
    expect(parseFrontmatter("---\n---\nbody")).toStrictEqual({
      data: {},
      content: "body",
    });
  });

  it("returns the source untouched without a leading block", () => {
    const source = "text\n---\ntitle: x\n---\n";

    expect(parseFrontmatter(source)).toStrictEqual({
      data: {},
      content: source,
    });
  });

  it("rejects front matter that is not a mapping", () => {
    expect(() => parseFrontmatter("---\n- a\n- b\n---\n")).toThrow(
      "Front matter must be a YAML mapping.",
    );
  });
});

describe("stringifyFrontmatter", () => {
  it("round-trips through parseFrontmatter", () => {
    const data = { title: "Hello: world", date: "2026-02-07", tags: ["a"] };
    const text = stringifyFrontmatter("# Body", data);

    expect(text.endsWith("# Body\n")).toBe(true);
    expect(parseFrontmatter(text)).toStrictEqual({ data, content: "# Body\n" });
  });

  it("omits the block when there is no data", () => {
    expect(stringifyFrontmatter("body\n", {})).toBe("body\n");
  });
});
