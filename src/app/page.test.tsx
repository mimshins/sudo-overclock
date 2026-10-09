import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomePage from "./page.tsx";

vi.mock("@repo/shared/ui/phosphor-field", () => ({
  PhosphorField: () => null,
}));

describe("HomePage", () => {
  it("names each call to action with its visible text", () => {
    render(<HomePage />);

    const blog = screen.getByRole("link", { name: "[ read the blog ]" });
    const about = screen.getByRole("link", { name: "[ who am i ]" });

    expect(blog).toHaveAttribute("href", expect.stringMatching(/^\/blog\/?$/u));
    expect(about).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/about\/?$/u),
    );
  });

  it("never overrides a call to action's visible text with a label", () => {
    const { container } = render(<HomePage />);
    const actions = container.querySelector<HTMLElement>(
      '[data-slot="home-actions"]',
    );

    if (actions === null) throw new Error("home actions missing");
    const links = within(actions).getAllByRole("link");

    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAccessibleName(link.textContent ?? "");
    }
    expect(screen.queryByRole("link", { name: "read more" })).toBeNull();
  });

  it("renders the main landmark as the skip-link target", () => {
    render(<HomePage />);

    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });
});
