import type { Metadata } from "next";

import {
  AUTHOR_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  TWITTER_HANDLE,
} from "./site.ts";

type PageMetadataInput = {
  readonly title?: string;
  readonly description?: string;
  readonly path?: string;
};

type ArticleMetadataInput = PageMetadataInput & {
  readonly title: string;
  readonly publishedTime: string;
  readonly author?: string;
  readonly tags?: readonly string[];
};

const OG_IMAGE_FILE = "og.png";
const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

const routePath = (path: string): string => {
  const rooted = path.startsWith("/") ? path : `/${path}`;
  return rooted.endsWith("/") ? rooted : `${rooted}/`;
};

const ogImagePath = (path?: string): string =>
  `${routePath(path ?? "/")}${OG_IMAGE_FILE}`;

const fullTitle = (title: string | undefined): string =>
  title === undefined || title === SITE_NAME
    ? SITE_NAME
    : `${title} — ${SITE_NAME}`;

const pageMetadata = ({
  title,
  description = SITE_DESCRIPTION,
  path: rawPath,
}: PageMetadataInput): Metadata => {
  const path = rawPath === undefined ? undefined : routePath(rawPath);
  const resolved = fullTitle(title);
  const image = {
    url: ogImagePath(path),
    ...OG_IMAGE_SIZE,
    type: "image/png",
    alt: path === undefined ? SITE_NAME : resolved,
  };

  return {
    title: resolved,
    description,
    ...(path === undefined ? {} : { alternates: { canonical: path } }),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      ...(path === undefined ? {} : { url: path }),
      title: resolved,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      creator: TWITTER_HANDLE,
      title: resolved,
      description,
      images: [image],
    },
  };
};

const articleMetadata = ({
  publishedTime,
  author = AUTHOR_NAME,
  tags = [],
  ...page
}: ArticleMetadataInput): Metadata => {
  const base = pageMetadata(page);

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime,
      authors: [author],
      tags: [...tags],
    },
  };
};

export type { ArticleMetadataInput, PageMetadataInput };
export { OG_IMAGE_SIZE, articleMetadata, ogImagePath, pageMetadata, routePath };
