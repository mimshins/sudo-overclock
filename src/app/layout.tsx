import { cx } from "@repo/shared/lib/cx";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { SiteFooter } from "./site-footer.tsx";
import { SiteHeader } from "./site-header.tsx";
import {
  AUTHOR_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  TWITTER_HANDLE,
} from "./site.ts";
import { SkipLink } from "./skip-link.tsx";
import { THEME_INIT_SCRIPT } from "./theme.ts";

import "./globals.css";

/*
 * Display face: undefined medium (SIL OFL-1.1). Self-hosted, unmodified.
 * Scoped to the wordmark and h1/h2 via --font-display; see docs/design-language.
 */
const displayFont = localFont({
  src: "./fonts/undefined-medium.woff2",
  variable: "--font-display-family",
  weight: "400",
  style: "normal",
  display: "swap",
  preload: true,
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Consolas",
    "monospace",
  ],
});

/*
 * Text face: JetBrains Mono (SIL OFL-1.1), the variable font with italics.
 * next/font downloads it at build time and serves it from this origin, so
 * readers never request Google Fonts.
 */
const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-mono-family",
  display: "swap",
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    "monospace",
  ],
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR_NAME }],
  creator: AUTHOR_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: {
      default: SITE_NAME,
    },
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    creator: TWITTER_HANDLE,
  },
};

const themeScriptProp = { __html: THEME_INIT_SCRIPT } as const;

type RootLayoutProps = {
  readonly children: ReactNode;
};

const RootLayout = (props: RootLayoutProps): ReactNode => {
  const { children } = props;
  return (
    <html
      lang="en"
      className={cx(displayFont.variable, monoFont.variable)}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={themeScriptProp} />
      </head>
      <body>
        <SkipLink />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
};

export default RootLayout;
