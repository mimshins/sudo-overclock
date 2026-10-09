import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({
  start: vi.fn<() => void>(),
  stop: vi.fn<() => void>(),
  refreshColors: vi.fn<() => void>(),
}));

vi.mock("./phosphor-field-session.ts", () => ({
  PhosphorSession: vi.fn(function PhosphorSession() {
    return session;
  }),
}));

const { PhosphorField } = await import("./phosphor-field.tsx");

afterEach(() => {
  vi.clearAllMocks();
  delete document.documentElement.dataset.theme;
});

describe("PhosphorField", () => {
  it("is a decorative canvas", () => {
    const { container } = render(<PhosphorField />);
    const canvas = container.querySelector('[data-slot="phosphor-field"]');

    expect(canvas?.tagName).toBe("CANVAS");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(session.start).toHaveBeenCalledOnce();
  });

  it("repaints with the new colors when the theme changes", async () => {
    render(<PhosphorField />);
    document.documentElement.dataset.theme = "light";

    await waitFor(() => {
      expect(session.refreshColors).toHaveBeenCalledOnce();
    });
  });

  it("stops following the theme once unmounted", async () => {
    const { unmount } = render(<PhosphorField />);

    unmount();
    document.documentElement.dataset.theme = "light";
    await Promise.resolve();

    expect(session.stop).toHaveBeenCalledOnce();
    expect(session.refreshColors).not.toHaveBeenCalled();
  });
});
