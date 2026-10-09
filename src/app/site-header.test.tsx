import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./site-header.tsx";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

vi.hoisted(() => {
  vi.stubEnv("__NEXT_TRAILING_SLASH", "true");
});

const renderAt = (pathname: string) => {
  vi.mocked(usePathname).mockReturnValue(pathname);
  return render(<SiteHeader />);
};

const primaryNav = () => screen.getByRole("navigation", { name: "primary" });

const currentLinks = () =>
  within(primaryNav())
    .getAllByRole("link")
    .filter(link => link.getAttribute("aria-current") === "page")
    .map(link => link.textContent);

afterAll(() => {
  vi.unstubAllEnvs();
});

const menuButton = () => screen.getByRole("button", { name: /menu$/u });

describe("SiteHeader", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReset();
  });

  describe("brand", () => {
    it("links home with the prompt glyph hidden from assistive tech", () => {
      renderAt("/about/");

      const brand = screen.getByRole("link", { name: "sudo-overclock" });

      expect(brand).toHaveAttribute("href", "/");
      expect(within(brand).getByText(">")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });
  });

  describe("primary nav", () => {
    it("lists every section as a bracketed link", () => {
      renderAt("/");

      const links = within(primaryNav()).getAllByRole("link");

      expect(primaryNav()).toHaveAttribute("id", "site-nav");
      expect(primaryNav()).toHaveAttribute("data-slot", "site-nav");
      expect(
        links.map(link => [link.textContent, link.getAttribute("href")]),
      ).toEqual([
        ["[ home ]", "/"],
        ["[ blog ]", "/blog/"],
        ["[ about ]", "/about/"],
        ["[ reading ]", "/reading/"],
      ]);
    });

    it.each([
      ["/", "[ home ]"],
      ["/blog/", "[ blog ]"],
      ["/about/", "[ about ]"],
      ["/reading/", "[ reading ]"],
    ])("marks only the matching link current on %s", (pathname, label) => {
      renderAt(pathname);

      expect(currentLinks()).toEqual([label]);
    });

    it.each(["/blog/posts/hello-world/", "/blog/tags/react/"])(
      "keeps the section current on the nested route %s",
      pathname => {
        renderAt(pathname);

        expect(currentLinks()).toEqual(["[ blog ]"]);
      },
    );

    it("marks nothing current on a route outside the nav", () => {
      renderAt("/missing/");

      expect(currentLinks()).toEqual([]);
    });
  });

  describe("menu button", () => {
    it("starts closed and controls the primary nav", () => {
      renderAt("/");

      expect(menuButton()).toHaveAccessibleName("open menu");
      expect(menuButton()).toHaveAttribute("aria-expanded", "false");
      expect(menuButton()).toHaveAttribute("aria-controls", "site-nav");
      expect(document.querySelector("#site-nav")).toBe(primaryNav());
    });

    it("toggles open and closed on click and renames itself", async () => {
      const user = userEvent.setup();
      renderAt("/");

      await user.click(menuButton());

      expect(menuButton()).toHaveAttribute("aria-expanded", "true");
      expect(menuButton()).toHaveAccessibleName("close menu");

      await user.click(menuButton());

      expect(menuButton()).toHaveAttribute("aria-expanded", "false");
      expect(menuButton()).toHaveAccessibleName("open menu");
    });

    it("closes on Escape and returns focus to the button", async () => {
      const user = userEvent.setup();
      renderAt("/");

      await user.click(menuButton());
      await user.tab();

      expect(
        within(primaryNav()).getByRole("link", { name: "[ home ]" }),
      ).toHaveFocus();

      await user.keyboard("{Escape}");

      expect(menuButton()).toHaveAttribute("aria-expanded", "false");
      expect(menuButton()).toHaveFocus();
    });

    it("leaves focus alone on Escape while closed", async () => {
      const user = userEvent.setup();
      renderAt("/");

      const blog = within(primaryNav()).getByRole("link", { name: "[ blog ]" });
      blog.focus();
      await user.keyboard("{Escape}");

      expect(blog).toHaveFocus();
      expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    });

    it("closes when a nav link is followed", async () => {
      const user = userEvent.setup();
      renderAt("/");

      await user.click(menuButton());
      await user.click(
        within(primaryNav()).getByRole("link", { name: "[ about ]" }),
      );

      expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    });
  });
});
