import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LEADER_RULE, Leader } from "./leader.tsx";

describe("Leader", () => {
  it("uses four U+2500 box-drawing characters per rule", () => {
    expect(LEADER_RULE).toBe("────");
  });

  it("shows the label between two rules hidden from assistive tech", () => {
    const { container } = render(<Leader>about.md</Leader>);
    const rules = container.querySelectorAll('[data-slot="leader-rule"]');

    expect(screen.getByText("about.md")).toHaveAttribute(
      "data-slot",
      "leader-label",
    );
    expect(rules).toHaveLength(2);
    for (const rule of rules) {
      expect(rule).toHaveAttribute("aria-hidden", "true");
      expect(rule).toHaveTextContent(LEADER_RULE);
    }
  });

  it("renders as the requested element and keeps its own slot", () => {
    render(
      <Leader
        as="h2"
        className="extra"
        id="now"
      >
        now
      </Leader>,
    );

    const heading = screen.getByRole("heading", { level: 2, name: "now" });

    expect(heading).toHaveAttribute("id", "now");
    expect(heading).toHaveAttribute("data-slot", "leader");
    expect(heading).toHaveClass("extra");
  });

  it("exposes only the label as its accessible name", () => {
    render(<Leader as="h2">blog.md</Leader>);

    expect(screen.getByRole("heading", { level: 2 })).toHaveAccessibleName(
      "blog.md",
    );
  });
});
