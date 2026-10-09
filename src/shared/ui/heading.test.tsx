import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Heading } from "./heading.tsx";

describe("Heading", () => {
  it("defaults to an h2", () => {
    render(<Heading>section</Heading>);

    expect(screen.getByRole("heading", { level: 2, name: "section" }));
  });

  it("takes its level from size when no as is given", () => {
    render(<Heading size="h4">small</Heading>);

    expect(screen.getByRole("heading", { level: 4, name: "small" }));
  });

  it("keeps the semantic level from as while sized differently", () => {
    render(
      <Heading
        as="h1"
        size="h2"
        glow
      >
        title
      </Heading>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "title" }),
    ).toHaveAttribute("data-slot", "heading");
  });
});
