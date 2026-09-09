"use client";

/*
 * CodeCopy — client component.
 *
 * Enhances server-rendered Shiki code blocks with a copy-to-clipboard button.
 * The post body HTML is rendered by PostBody (a server component) and stays out
 * of the client bundle; this component only adds the interactive button after
 * mount by wrapping each `<pre>` in a positioned container.
 */

import { cx } from "@repo/shared/lib/cx";
import { useEffect } from "react";

import styles from "./code-copy.module.css";

const COPY_LABEL = "[ copy ]";
const COPIED_LABEL = "[ copied ]";
const RESET_DELAY_MS = 1500;

const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const attachCopyButton = (block: HTMLElement): (() => void) => {
  const wrapper = document.createElement("div");
  wrapper.className = cx(styles.wrapper);
  block.parentNode?.insertBefore(wrapper, block);
  wrapper.append(block);
  block.style.margin = "0";

  const button = document.createElement("button");
  button.type = "button";
  button.className = cx(styles.button);
  button.textContent = COPY_LABEL;
  button.setAttribute("aria-label", "copy code");

  const handleCopy = async () => {
    const code =
      block.querySelector("code")?.textContent ?? block.textContent ?? "";

    if (!(await copyText(code))) return;

    button.textContent = COPIED_LABEL;
    window.setTimeout(() => {
      button.textContent = COPY_LABEL;
    }, RESET_DELAY_MS);
  };

  const onClick = () => {
    void handleCopy();
  };

  button.addEventListener("click", onClick);
  wrapper.append(button);

  return () => {
    button.removeEventListener("click", onClick);
    wrapper.parentNode?.insertBefore(block, wrapper);
    wrapper.remove();
  };
};

const CodeCopy = () => {
  useEffect(() => {
    const blocks = Array.from(
      document.querySelectorAll<HTMLElement>('[data-slot="post-body"] pre'),
    );
    const teardowns = blocks.map(block => attachCopyButton(block));

    return () => {
      for (const teardown of teardowns) teardown();
    };
  }, []);

  return null;
};

export { CodeCopy };
