import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CodeCopy } from "./code-copy.tsx";

const RESET_DELAY_MS = 1500;

const Fixture = () => (
  <>
    <div data-slot="post-body">
      <pre>
        <code>const a = 1;</code>
      </pre>
      <p>between</p>
      <pre>
        <code>let b = 2;</code>
      </pre>
    </div>
    <pre>
      <code>outside the post body</code>
    </pre>
    <CodeCopy />
  </>
);

let writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const copyButton = (index: number): HTMLElement => {
  const button = screen.getAllByRole("button", { name: "[ copy ]" }).at(index);
  if (button === undefined) throw new Error(`no copy button at ${index}`);
  return button;
};

const setup = () => {
  const user = userEvent.setup({
    advanceTimers: ms => vi.advanceTimersByTime(ms),
  });
  vi.spyOn(navigator.clipboard, "writeText").mockImplementation(writeText);
  return user;
};

describe("CodeCopy", () => {
  it("adds one [ copy ] button per post-body code block", () => {
    render(<Fixture />);

    const buttons = screen.getAllByRole("button", { name: "[ copy ]" });

    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button).toHaveTextContent("[ copy ]");
      expect(button).toHaveAttribute("data-slot", "code-copy-button");
    }
  });

  it("copies the block's code to the clipboard", async () => {
    const user = setup();
    render(<Fixture />);

    await user.click(copyButton(1));

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith("let b = 2;");
  });

  it("shows [ copied ], announces it politely, then reverts", async () => {
    const user = setup();
    render(<Fixture />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toBeEmptyDOMElement();

    const first = copyButton(0);
    await user.click(first);

    expect(first).toHaveAccessibleName("[ copied ]");
    expect(status).toHaveTextContent("code copied");

    act(() => {
      vi.advanceTimersByTime(RESET_DELAY_MS);
    });

    expect(first).toHaveAccessibleName("[ copy ]");
    expect(status).toBeEmptyDOMElement();
  });

  it("keeps [ copy ] and stays silent when the clipboard rejects", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    const user = setup();
    render(<Fixture />);

    const first = copyButton(0);
    await user.click(first);

    expect(first).toHaveAccessibleName("[ copy ]");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("restores the original markup on unmount", () => {
    const { container, unmount } = render(<Fixture />);
    const body = container.querySelector<HTMLElement>(
      '[data-slot="post-body"]',
    );
    if (body === null) throw new Error("post body missing");

    unmount();

    expect(within(body).queryByRole("button")).not.toBeInTheDocument();
  });
});
