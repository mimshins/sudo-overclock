import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MouseEventHandler } from "react";
import { describe, expect, it, vi } from "vitest";

import { Tag } from "./tag.tsx";

describe("Tag", () => {
  it("is a plain label without onClick", () => {
    render(<Tag>go</Tag>);

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("go")).toHaveAttribute("data-slot", "tag");
  });

  it("is a toggle button that exposes its pressed state", () => {
    const { rerender } = render(
      <Tag onClick={vi.fn<MouseEventHandler<HTMLButtonElement>>()}>go</Tag>,
    );

    expect(screen.getByRole("button", { name: "go" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    rerender(
      <Tag
        active
        onClick={vi.fn<MouseEventHandler<HTMLButtonElement>>()}
      >
        go
      </Tag>,
    );
    expect(screen.getByRole("button", { name: "go" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn<MouseEventHandler<HTMLButtonElement>>();

    render(<Tag onClick={onClick}>go</Tag>);
    await userEvent.setup().click(screen.getByRole("button", { name: "go" }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
