import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { PostSummary } from "../domain/post.ts";
import { PostFilter } from "./post-filter.tsx";

const summary = (
  slug: string,
  date: string,
  tags: readonly string[],
): PostSummary => ({
  id: slug,
  slug,
  title: slug,
  date,
  description: "",
  tags,
  readingTimeMinutes: 3,
});

const posts: readonly PostSummary[] = [
  summary("middle-rust", "2026-02-01", ["rust"]),
  summary("oldest-css", "2026-01-01", ["css"]),
  summary("newest-both", "2026-03-01", ["rust", "css"]),
];

const tags = ["css", "rust"];

const renderFilter = () =>
  render(
    <PostFilter
      posts={posts}
      tags={tags}
    />,
  );

const listedTitles = (): string[] => {
  const list = document.querySelector<HTMLElement>('[data-slot="post-list"]');
  if (list === null) return [];
  return within(list)
    .getAllByRole("heading", { level: 2 })
    .map(heading => heading.textContent ?? "");
};

const chip = (name: string): HTMLElement =>
  screen.getByRole("button", { name });

describe("PostFilter", () => {
  it("lists every post newest first with the all chip pressed", () => {
    renderFilter();

    expect(listedTitles()).toEqual([
      "newest-both",
      "middle-rust",
      "oldest-css",
    ]);
    expect(chip("all")).toHaveAttribute("aria-pressed", "true");
    expect(chip("css")).toHaveAttribute("aria-pressed", "false");
    expect(chip("rust")).toHaveAttribute("aria-pressed", "false");
  });

  it("filters by the selected tag and presses only that chip", async () => {
    const user = userEvent.setup();
    renderFilter();

    await user.click(chip("rust"));

    expect(listedTitles()).toEqual(["newest-both", "middle-rust"]);
    expect(chip("rust")).toHaveAttribute("aria-pressed", "true");
    expect(chip("all")).toHaveAttribute("aria-pressed", "false");
    expect(chip("css")).toHaveAttribute("aria-pressed", "false");

    await user.click(chip("css"));

    expect(listedTitles()).toEqual(["newest-both", "oldest-css"]);
    expect(chip("css")).toHaveAttribute("aria-pressed", "true");
    expect(chip("rust")).toHaveAttribute("aria-pressed", "false");
  });

  it("returns to every post when the all chip is selected", async () => {
    const user = userEvent.setup();
    renderFilter();

    await user.click(chip("css"));
    await user.click(chip("all"));

    expect(listedTitles()).toHaveLength(3);
    expect(chip("all")).toHaveAttribute("aria-pressed", "true");
    expect(chip("css")).toHaveAttribute("aria-pressed", "false");
  });

  it("names the sort toggle with its visible text and current order", async () => {
    const user = userEvent.setup();
    renderFilter();

    const toggle = screen.getByRole("button", { name: "[ newest ]" });

    expect(toggle).toHaveTextContent("[ newest ]");

    await user.click(toggle);

    expect(toggle).toHaveAccessibleName("[ oldest ]");
    expect(toggle).toHaveTextContent("[ oldest ]");
    expect(listedTitles()).toEqual([
      "oldest-css",
      "middle-rust",
      "newest-both",
    ]);

    await user.click(toggle);

    expect(toggle).toHaveAccessibleName("[ newest ]");
    expect(listedTitles()).toEqual([
      "newest-both",
      "middle-rust",
      "oldest-css",
    ]);
  });

  it("keeps the sort order while filtering", async () => {
    const user = userEvent.setup();
    renderFilter();

    await user.click(screen.getByRole("button", { name: "[ newest ]" }));
    await user.click(chip("rust"));

    expect(listedTitles()).toEqual(["middle-rust", "newest-both"]);
  });
});
