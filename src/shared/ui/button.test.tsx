import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MouseEventHandler } from "react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button.tsx";

describe("Button", () => {
  it("renders a button carrying its slot", () => {
    render(<Button>[ ok ]</Button>);

    expect(screen.getByRole("button", { name: "[ ok ]" })).toHaveAttribute(
      "data-slot",
      "button",
    );
  });

  it("renders as a link with as=a and passes href through", () => {
    render(
      <Button
        as="a"
        href="/blog/"
      >
        [ read the blog ]
      </Button>,
    );

    expect(
      screen.getByRole("link", { name: "[ read the blog ]" }),
    ).toHaveAttribute("href", "/blog/");
  });

  it("calls onClick when pressed", async () => {
    const onClick = vi.fn<MouseEventHandler<HTMLButtonElement>>();

    render(<Button onClick={onClick}>[ go ]</Button>);
    await userEvent.setup().click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire when disabled", async () => {
    const onClick = vi.fn<MouseEventHandler<HTMLButtonElement>>();

    render(
      <Button
        disabled
        onClick={onClick}
      >
        [ go ]
      </Button>,
    );
    await userEvent.setup().click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });
});
