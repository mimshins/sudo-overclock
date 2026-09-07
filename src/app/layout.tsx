import { BlogModuleProvider } from "@repo/modules/blog/presentation/blog-module-provider";

import "./globals.css";

import type { ReactNode } from "react";

export const metadata = {
  title: "sudo-overclock",
  description: "Engineering blog of @mimshins (Mostafa Shamsitabar)",
};

const THEME_INIT_SCRIPT = `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = stored === 'dark' || stored === 'light' ? stored : system;
    document.documentElement.setAttribute('data-theme', theme);
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
    <html lang="en">
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
        <BlogModuleProvider>{children}</BlogModuleProvider>
      </body>
    </html>
  );
};

export default RootLayout;
