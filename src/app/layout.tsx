import type { ReactNode } from "react";

import { SiteFooter } from "./site-footer.tsx";
import { SiteHeader } from "./site-header.tsx";

import "./globals.css";

import {
  AUTHOR_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  TWITTER_HANDLE,
} from "./site.ts";

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

// Dark-only: pin the CRT theme regardless of system preference.
const THEME_INIT_SCRIPT = `(() => {
  try {
    document.documentElement.setAttribute('data-theme', 'dark');
  } catch (_) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();`;

const themeScriptProp = { __html: THEME_INIT_SCRIPT } as const;

const fontLinkHref =
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap";

type RootLayoutProps = {
  readonly children: ReactNode;
};

const RootLayout = (props: RootLayoutProps): ReactNode => {
  const { children } = props;
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={themeScriptProp} />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href={fontLinkHref}
        />
      </head>
      <body>
        <a
          className="skip-link"
          href="#main"
        >
          skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
};

export default RootLayout;
