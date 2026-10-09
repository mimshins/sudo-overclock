import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Caption } from "./caption.tsx";
import { InlineCode } from "./inline-code.tsx";
import { Kbd } from "./kbd.tsx";
import { Lead } from "./lead.tsx";
import { Paragraph } from "./paragraph.tsx";

describe("text primitives", () => {
  it("Paragraph renders a p by default and honors as", () => {
    const { container, rerender } = render(<Paragraph>body</Paragraph>);

    expect(container.firstElementChild?.tagName).toBe("P");
    expect(container.firstElementChild).toHaveAttribute(
      "data-slot",
      "paragraph",
    );

    rerender(<Paragraph as="div">body</Paragraph>);
    expect(container.firstElementChild?.tagName).toBe("DIV");
  });

  it("Lead renders a p with its slot", () => {
    render(<Lead size="subheading2">intro</Lead>);

    expect(screen.getByText("intro").tagName).toBe("P");
    expect(screen.getByText("intro")).toHaveAttribute("data-slot", "lead");
  });

  it("Caption is a span by default and honors as", () => {
    const { rerender } = render(<Caption>meta</Caption>);

    expect(screen.getByText("meta").tagName).toBe("SPAN");
    expect(screen.getByText("meta")).toHaveAttribute("data-slot", "caption");

    rerender(<Caption as="time">meta</Caption>);
    expect(screen.getByText("meta").tagName).toBe("TIME");
  });

  it("Caption applies a different class when uppercase is turned off", () => {
    const { rerender } = render(<Caption>meta</Caption>);
    const upper = screen.getByText("meta").className;

    rerender(<Caption uppercase={false}>meta</Caption>);

    expect(screen.getByText("meta").className).not.toBe(upper);
  });

  it("Kbd and InlineCode render their semantic elements", () => {
    render(
      <p>
        press <Kbd>Esc</Kbd> or run <InlineCode>pnpm dev</InlineCode>
      </p>,
    );

    expect(screen.getByText("Esc").tagName).toBe("KBD");
    expect(screen.getByText("Esc")).toHaveAttribute("data-slot", "kbd");
    expect(screen.getByText("pnpm dev").tagName).toBe("CODE");
    expect(screen.getByText("pnpm dev")).toHaveAttribute(
      "data-slot",
      "inline-code",
    );
  });
});
