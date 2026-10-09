import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Blockquote } from "./blockquote.tsx";
import { CodeBlock } from "./code-block.tsx";
import { List, ListItem } from "./list.tsx";

describe("block primitives", () => {
  it("Blockquote keeps the decorative marker out of the accessible text", () => {
    const { container } = render(
      <Blockquote cite="https://example.com">quoted words</Blockquote>,
    );
    const quote = container.querySelector('[data-slot="blockquote"]');

    expect(quote?.tagName).toBe("BLOCKQUOTE");
    expect(quote).toHaveAttribute("cite", "https://example.com");
    expect(
      container.querySelector('[data-slot="blockquote-marker"]'),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("CodeBlock shows the filename and language and wraps code in a pre", () => {
    const { container } = render(
      <CodeBlock
        filename="compile.ts"
        language="ts"
      >
        <code>const x = 1;</code>
      </CodeBlock>,
    );

    expect(screen.getByText("compile.ts")).toHaveAttribute(
      "data-slot",
      "code-block-filename",
    );
    expect(screen.getByText("ts")).toHaveAttribute(
      "data-slot",
      "code-block-language",
    );
    const pre = container.querySelector('[data-slot="code-block-pre"]');

    expect(pre?.tagName).toBe("PRE");
    expect(pre).toHaveTextContent("const x = 1;");
  });

  it("List is a ul, or an ol when ordered", () => {
    const { rerender } = render(
      <List>
        <ListItem>one</ListItem>
      </List>,
    );

    expect(screen.getByRole("list").tagName).toBe("UL");

    rerender(
      <List ordered>
        <ListItem>one</ListItem>
      </List>,
    );
    expect(screen.getByRole("list").tagName).toBe("OL");
  });

  it("ListItem honors as and does not leak it to the DOM", () => {
    const { container } = render(
      <List as="div">
        <ListItem as="div">custom</ListItem>
      </List>,
    );
    const item = screen.getByText("custom");

    expect(item.tagName).toBe("DIV");
    expect(item).toHaveAttribute("data-slot", "list-item");
    expect(item).not.toHaveAttribute("as");
    expect(container.querySelector("[as]")).toBeNull();
  });
});
