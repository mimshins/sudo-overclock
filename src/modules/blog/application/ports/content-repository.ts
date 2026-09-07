/*
 * Ports — interfaces the application layer needs from the outside.
 *
 * Each port describes a capability. The infrastructure layer provides the
 * concrete adapter. The presentation layer consumes the application services
 * which use these ports.
 *
 * No React, no Next, no Node. Pure TS.
 */

import type { Post, PostSummary } from "../../domain/post.ts";

/**
 * Reads raw markdown posts and returns them as compiled domain objects. The
 * compiler (infrastructure layer) provides the adapter.
 */
type ContentRepository = {
  readonly getAllPostSummaries: () => readonly PostSummary[];
  readonly getPostBySlug: (slug: string) => Post | null;
};

export type { ContentRepository };
