import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { Button } from "./button.tsx";
import { Caption } from "./caption.tsx";
import { Heading } from "./heading.tsx";
import { Kbd } from "./kbd.tsx";
import { Lead } from "./lead.tsx";
import { Leader } from "./leader.tsx";
import { Paragraph } from "./paragraph.tsx";

const primitives: ReadonlyArray<readonly [string, () => ReactElement]> = [
  ["button", () => <Button data-slot="custom">b</Button>],
  ["caption", () => <Caption data-slot="custom">c</Caption>],
  ["heading", () => <Heading data-slot="custom">h</Heading>],
  ["kbd", () => <Kbd data-slot="custom">k</Kbd>],
  ["lead", () => <Lead data-slot="custom">l</Lead>],
  ["leader", () => <Leader data-slot="custom">l</Leader>],
  ["paragraph", () => <Paragraph data-slot="custom">p</Paragraph>],
];

describe("primitive slots", () => {
  it.each(primitives)("%s keeps its slot over a caller's", (slot, element) => {
    const { container } = render(element());

    expect(container.firstElementChild).toHaveAttribute("data-slot", slot);
  });
});
