"use client";

import { createContext as createReactContext, useContext } from "react";

/*
 * Typed dependency-injection helper.
 *
 * Modules declare the ports they need as TS interfaces in `application/ports/`.
 * The composition root creates a real adapter and provides it via this context.
 * Components in `presentation/` consume the typed value through
 * `useXxxContext()`.
 *
 * No runtime framework, no decorators. Just a wrapper around React's
 * `createContext` that produces a strict `useXxx` hook.
 *
 * Usage:
 *
 * type ContentRepository = { ... };
 *
 * const [ContentRepositoryContext, useContentRepository] =
 * createContext<ContentRepository>("ContentRepository");
 *
 * // In a provider:
 * <ContentRepositoryContext value={adapter}>...</ContentRepositoryContext>
 *
 * // In a consumer:
 * const repo = useContentRepository();
 */

type Context<T> = React.Context<T | null>;
type UseContextHook<T> = () => T;

const createContext = <T>(
  displayName: string,
): [Context<T>, UseContextHook<T>] => {
  const Context = createReactContext<T | null>(null);

  Context.displayName = displayName;

  const useCtx = (): T => {
    const value = useContext(Context);

    if (value === null) {
      throw new Error(
        `${displayName} is missing. Wrap your tree with its provider.`,
      );
    }

    return value;
  };

  return [Context, useCtx];
};

export { createContext };
export type { Context, UseContextHook };
