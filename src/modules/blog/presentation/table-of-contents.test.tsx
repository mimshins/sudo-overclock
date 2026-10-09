import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PostTocItem } from "../domain/post.ts";
import { TableOfContents } from "./table-of-contents.tsx";

const items: readonly PostTocItem[] = [
  { id: "intro", text: "intro", depth: 2 },
  { id: "setup", text: "setup", depth: 3 },
  { id: "wrap-up", text: "wrap up", depth: 2 },
];

const VIEWPORT_HEIGHT = 1000;
const BELOW_LINE = 800;
const ABOVE_LINE = 100;

const NO_ITEMS: readonly PostTocItem[] = [];

let tops: Record<string, number> = {};
let frames: FrameRequestCallback[] = [];

const Fixture = ({ toc }: { readonly toc: readonly PostTocItem[] }) => (
  <>
    {toc.map(item => (
      <h2
        key={item.id}
        id={item.id}
      >
        {item.text}
      </h2>
    ))}
    <TableOfContents items={toc} />
  </>
);

const scrollTo = (next: Record<string, number>): void => {
  tops = next;
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
  act(() => {
    for (const frame of frames.splice(0)) frame(0);
  });
};

const link = (name: string): HTMLElement => screen.getByRole("link", { name });

const currentLinks = (): HTMLElement[] =>
  within(screen.getByRole("navigation", { name: "table of contents" }))
    .getAllByRole("link")
    .filter(el => el.getAttribute("aria-current") === "location");

beforeEach(() => {
  tops = {};
  frames = [];
  vi.stubGlobal("innerHeight", VIEWPORT_HEIGHT);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: VIEWPORT_HEIGHT * 10,
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      return DOMRect.fromRect({ y: tops[this.id] ?? BELOW_LINE });
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document.documentElement, "scrollHeight");
});

describe("TableOfContents", () => {
  it("links every heading by anchor and keeps its depth", () => {
    render(<Fixture toc={items} />);

    const nav = screen.getByRole("navigation", { name: "table of contents" });
    const entries = within(nav).getAllByRole("listitem");

    const rendered = entries.map(entry => {
      const anchor = within(entry).getByRole("link");
      return {
        slot: entry.dataset.slot,
        depth: entry.dataset.depth,
        name: anchor.textContent,
        href: anchor.getAttribute("href"),
      };
    });

    expect(rendered).toEqual(
      items.map(item => ({
        slot: "toc-item",
        depth: String(item.depth),
        name: item.text,
        href: `#${item.id}`,
      })),
    );
  });

  it("captions the list with on this page", () => {
    render(<Fixture toc={items} />);

    const nav = screen.getByRole("navigation", { name: "table of contents" });

    expect(within(nav).getByText("on this page")).toBeInTheDocument();
  });

  it("marks no entry current before any heading crosses the line", () => {
    render(<Fixture toc={items} />);

    expect(currentLinks()).toEqual([]);
  });

  it("marks the last heading above the reading line as the location", () => {
    tops = { intro: ABOVE_LINE, setup: BELOW_LINE, "wrap-up": BELOW_LINE };
    render(<Fixture toc={items} />);

    expect(link("intro")).toHaveAttribute("aria-current", "location");
    expect(currentLinks()).toHaveLength(1);

    scrollTo({ intro: -500, setup: ABOVE_LINE, "wrap-up": BELOW_LINE });

    expect(link("setup")).toHaveAttribute("aria-current", "location");
    expect(link("intro")).not.toHaveAttribute("aria-current");
    expect(currentLinks()).toHaveLength(1);

    scrollTo({ intro: -1500, setup: -900, "wrap-up": ABOVE_LINE });

    expect(link("wrap up")).toHaveAttribute("aria-current", "location");
    expect(currentLinks()).toHaveLength(1);
  });

  it("marks the last heading at the bottom of a short page", () => {
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: VIEWPORT_HEIGHT,
    });
    render(<Fixture toc={items} />);

    expect(link("wrap up")).toHaveAttribute("aria-current", "location");
  });

  it("renders nothing, caption included, without headings", () => {
    const { container } = render(<TableOfContents items={NO_ITEMS} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("on this page")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
