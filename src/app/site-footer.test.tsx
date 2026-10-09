import { render, screen, within } from "@testing-library/react";
import { afterAll, describe, expect, it, vi } from "vitest";

import { SiteFooter } from "./site-footer.tsx";

vi.hoisted(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_VERSION", "1.4.2");
  vi.stubEnv("NEXT_PUBLIC_CONTENT_SHA", "abc1234");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("SiteFooter", () => {
  it("renders the social links as bracketed external links", () => {
    render(<SiteFooter />);

    const socials = screen.getByRole("navigation", { name: "social" });
    const links = within(socials).getAllByRole("link");

    expect(socials).toHaveAttribute("data-slot", "site-socials");
    expect(links.map(link => link.textContent)).toEqual([
      "[ linkedin ]",
      "[ github ]",
      "[ twitter ]",
    ]);
    expect(
      within(socials).getByRole("link", { name: "[ github ]" }),
    ).toHaveAttribute("href", "https://github.com/mimshins");
    for (const link of links) {
      expect(link).toHaveAttribute(
        "href",
        expect.stringMatching(/^https:\/\//u),
      );
      expect(link).toHaveAttribute("rel", "me noreferrer");
      expect(link).toHaveAttribute("target", "_blank");
    }
  });

  it("shows the code version and content revision from the build env", () => {
    const { container } = render(<SiteFooter />);
    const version = container.querySelector('[data-slot="site-version"]');

    expect(version).toHaveTextContent(/^v1\.4\.2 · abc1234$/u);
  });

  it("names the site in the copyright line", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      `© ${new Date().getFullYear()} · sudo-overclock ·`,
    );
  });
});
