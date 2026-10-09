/*
 * Open Graph card — renders a route's 1200×630 share image at build time.
 *
 * The dot layer is painted with sharp from `public/<background>/bg.jpg` (or
 * procedurally when there is no background) and laid under a Leader, a display
 * title, and the wordmark via next/og. Fonts are build-only TTF copies of the
 * shipped faces because Satori cannot read woff2. The theme, fonts, and each
 * background's dot layer are loaded once per build worker.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  imageGrid,
  paintImageDots,
  paintProceduralDots,
  type Canvas,
} from "@repo/shared/lib/dot-painter";
import {
  IMAGE_STYLE,
  PROCEDURAL_STYLE,
} from "@repo/shared/ui/phosphor-field-core";
import { ImageResponse } from "next/og";
import type { CSSProperties } from "react";
import sharp from "sharp";

import { OG_IMAGE_SIZE } from "./metadata.ts";
import { loadOgTheme, strikeShadow, type OgTheme } from "./og-theme.ts";
import { SITE_NAME, SITE_URL } from "./site.ts";

type OgCard = {
  readonly leader: string;
  readonly title: string;
  readonly path: string;
  readonly background: string | null;
  readonly meta?: string;
};

type Fonts = readonly [display: Buffer, mono: Buffer];

const PADDING = 72;
const LEADER_RULE = "─".repeat(4);
const DISPLAY_FAMILY = "undefined medium";
const MONO_FAMILY = "JetBrains Mono";
const HOME_PATCH = { x: 930, y: 250, radius: 150 } as const;

/* Cards are read as thumbnails: coarser, brighter photo dots and a heavier home dither than the live field. */
const CARD_IMAGE_STYLE = { ...IMAGE_STYLE, pitch: 5 };
const CARD_IMAGE_GAIN = 1.5;
const CARD_PROCEDURAL_STYLE = {
  ...PROCEDURAL_STYLE,
  sizeMin: 2,
  sizeMax: 3,
  alphaMin: 0.14,
  alphaMax: 0.4,
};

let themeCache: OgTheme | null = null;
let fontsCache: Promise<Fonts> | null = null;
const dotsCache = new Map<string, Promise<string>>();

const ogTheme = (): OgTheme => (themeCache ??= loadOgTheme());

const fontFile = (name: string): Promise<Buffer> =>
  readFile(join(process.cwd(), "src/app/fonts", name));

const loadFonts = (): Promise<Fonts> =>
  (fontsCache ??= Promise.all([
    fontFile("undefined-medium.ttf"),
    fontFile("jetbrains-mono-bold.ttf"),
  ]));

const titleSize = (title: string): number =>
  title.length > 40 ? 50 : title.length > 22 ? 60 : 80;

const canvasFor = (theme: OgTheme): Canvas => ({
  width: OG_IMAGE_SIZE.width,
  height: OG_IMAGE_SIZE.height,
  background: theme.backgroundRgb,
  quiet: {
    left: 0,
    top: 170,
    right: 760,
    bottom: OG_IMAGE_SIZE.height,
    keep: 0.18,
    feather: 140,
  },
});

const sampleBackground = async (background: string, canvas: Canvas) => {
  const { cols, rows } = imageGrid(
    canvas.width,
    canvas.height,
    CARD_IMAGE_STYLE.pitch,
  );
  const data = await sharp(join(process.cwd(), "public", background, "bg.jpg"))
    .resize(cols, rows, { fit: "cover" })
    .removeAlpha()
    .ensureAlpha()
    .raw()
    .toBuffer();
  return { cols, rows, data };
};

const paintDots = async (
  background: string | null,
  theme: OgTheme,
): Promise<string> => {
  const canvas = canvasFor(theme);
  const pixels =
    background === null
      ? paintProceduralDots(
          canvas,
          CARD_PROCEDURAL_STYLE,
          theme.foregroundTertiaryRgb,
          theme.phosphorRgb,
          HOME_PATCH,
        )
      : paintImageDots(
          canvas,
          await sampleBackground(background, canvas),
          CARD_IMAGE_STYLE,
          CARD_IMAGE_GAIN,
        );

  const png = await sharp(Buffer.from(pixels.buffer), {
    raw: { width: canvas.width, height: canvas.height, channels: 4 },
  })
    .png()
    .toBuffer();

  return `data:image/png;base64,${png.toString("base64")}`;
};

const cachedDots = (background: string | null, theme: OgTheme) => {
  const key = background ?? "";
  let dots = dotsCache.get(key);
  if (dots === undefined) {
    dots = paintDots(background, theme);
    dotsCache.set(key, dots);
  }
  return dots;
};

const cardStyles = (theme: OgTheme, titlePx: number) => {
  const strike = (px: number): string => strikeShadow(theme, px);

  return {
    root: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      width: "100%",
      height: "100%",
      padding: PADDING,
      backgroundColor: theme.background,
      color: theme.foreground,
      fontFamily: MONO_FAMILY,
    },
    dots: { position: "absolute", top: 0, left: 0 },
    leader: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      fontSize: 22,
      textTransform: "uppercase",
    },
    rule: { color: theme.foregroundTertiary },
    plate: {
      padding: "4px 12px",
      backgroundColor: theme.phosphor,
      color: theme.onPhosphor,
      letterSpacing: "0.15em",
    },
    title: {
      display: "flex",
      marginTop: 28,
      maxWidth: 940,
      fontFamily: DISPLAY_FAMILY,
      fontSize: titlePx,
      lineHeight: 1.2,
      letterSpacing: 0,
      textShadow: `${strike(titlePx)}, ${theme.displayGlow}`,
    },
    meta: {
      display: "flex",
      marginTop: 16,
      fontSize: 24,
      color: theme.foregroundSecondary,
    },
    footer: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: 56,
    },
    wordmark: {
      fontFamily: DISPLAY_FAMILY,
      fontSize: 30,
      color: theme.phosphor,
      textShadow: strike(30),
    },
    url: { fontSize: 22, color: theme.foregroundTertiary },
  } satisfies Record<string, CSSProperties>;
};

const renderOgCard = async (card: OgCard): Promise<ImageResponse> => {
  const theme = ogTheme();
  const [dots, [display, mono]] = await Promise.all([
    cachedDots(card.background, theme),
    loadFonts(),
  ]);
  const styles = cardStyles(theme, titleSize(card.title));
  const url = new URL(card.path, SITE_URL);

  return new ImageResponse(
    <div style={styles.root}>
      <img
        alt=""
        src={dots}
        width={OG_IMAGE_SIZE.width}
        height={OG_IMAGE_SIZE.height}
        style={styles.dots}
      />
      <div style={styles.leader}>
        <span style={styles.rule}>{LEADER_RULE}</span>
        <span style={styles.plate}>{card.leader}</span>
        <span style={styles.rule}>{LEADER_RULE}</span>
      </div>
      <div style={styles.title}>{card.title}</div>
      {card.meta === undefined ? null : (
        <div style={styles.meta}>{card.meta}</div>
      )}
      <div style={styles.footer}>
        <span style={styles.wordmark}>
          {card.title === SITE_NAME ? "" : SITE_NAME}
        </span>
        <span style={styles.url}>{`${url.host}${url.pathname}`}</span>
      </div>
    </div>,
    {
      ...OG_IMAGE_SIZE,
      fonts: [
        { name: DISPLAY_FAMILY, data: display, weight: 400, style: "normal" },
        { name: MONO_FAMILY, data: mono, weight: 700, style: "normal" },
      ],
    },
  );
};

export type { OgCard };
export { renderOgCard };
