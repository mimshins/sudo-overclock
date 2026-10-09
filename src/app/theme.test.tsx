import { runInThisContext } from "node:vm";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "./theme-toggle.tsx";
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "./theme.ts";

type Listener = (event: Pick<MediaQueryListEvent, "matches">) => void;

const mockSystem = (prefersLight: boolean) => {
  const listeners = new Set<Listener>();
  const media = {
    matches: prefersLight,
    addEventListener: (_: string, listener: Listener) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) =>
      listeners.delete(listener),
  };

  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => media),
  );

  return {
    listeners,
    change: (matches: boolean) => {
      media.matches = matches;
      for (const listener of listeners) {
        listener({ matches });
      }
    },
  };
};

const runBootScript = () => {
  runInThisContext(THEME_INIT_SCRIPT);
};

const theme = () => document.documentElement.dataset.theme;

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("theme boot script", () => {
  it("follows the OS on a first visit", () => {
    mockSystem(true);
    runBootScript();
    expect(theme()).toBe("light");

    mockSystem(false);
    runBootScript();
    expect(theme()).toBe("dark");
  });

  it("prefers the stored choice over the OS", () => {
    mockSystem(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    runBootScript();

    expect(theme()).toBe("dark");
  });

  it("ignores an unknown stored value", () => {
    mockSystem(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    runBootScript();

    expect(theme()).toBe("light");
  });

  it("falls back to dark when storage throws", () => {
    mockSystem(true);
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new Error("blocked");
    });
    runBootScript();

    expect(theme()).toBe("dark");
  });
});

describe("ThemeToggle", () => {
  it("is a pressed toggle when the light theme is on", () => {
    mockSystem(false);
    document.documentElement.dataset.theme = "light";
    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "[ light ]" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("switches themes and remembers the choice", async () => {
    mockSystem(false);
    document.documentElement.dataset.theme = "dark";
    render(<ThemeToggle />);
    const toggle = screen.getByRole("button", { name: "[ light ]" });

    await userEvent.setup().click(toggle);
    expect(theme()).toBe("light");
    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-pressed", "true");
    });
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");

    await userEvent.setup().click(toggle);
    expect(theme()).toBe("dark");
    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-pressed", "false");
    });
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("follows OS changes until the reader picks a theme", async () => {
    const system = mockSystem(false);
    document.documentElement.dataset.theme = "dark";
    render(<ThemeToggle />);

    act(() => {
      system.change(true);
    });
    expect(theme()).toBe("light");
    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    act(() => {
      system.change(false);
    });
    expect(theme()).toBe("light");
  });

  it("stops listening to the OS when unmounted", () => {
    const system = mockSystem(false);
    const { unmount } = render(<ThemeToggle />);

    expect(system.listeners.size).toBe(1);
    unmount();
    expect(system.listeners.size).toBe(0);
  });
});
