import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SkipLink } from "./skip-link.tsx";

describe("SkipLink", () => {
  it("links to the main landmark under its visible label", () => {
    render(<SkipLink />);

    const link = screen.getByRole("link", { name: "skip to content" });

    expect(link).toHaveAttribute("href", "#main");
    expect(link).toHaveAttribute("data-slot", "skip-link");
  });
});
