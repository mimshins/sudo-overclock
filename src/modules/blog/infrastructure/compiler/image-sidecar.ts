/*
 * Image store sidecar codec.
 *
 * Each image store entry carries a `<hash>.json` sidecar describing what the
 * markup needs — the encoded variants and intrinsic size — so a hit restores
 * an image without decoding it. Parsing is strict: anything malformed, from an
 * older format, or for another hash is rejected and the entry is treated as a
 * miss.
 */

type StoredSource = {
  readonly type: string;
  readonly extension: string;
};

/**
 * What a prepared image needs to be restored without decoding it: the encoded
 * variants and intrinsic size of a `picture`, or a `plain` marker for an image
 * that is shipped as-is (its bytes are the source, which the caller has).
 */
type StoredImage =
  | {
      readonly kind: "picture";
      readonly sources: readonly StoredSource[];
      readonly fallbackExtension: string;
      readonly width: number;
      readonly height: number;
    }
  | {
      readonly kind: "plain";
    };

const SIDECAR_VERSION = 1;
const SIDECAR_EXTENSION = "json";

const EXTENSION_PATTERN = /^[a-z0-9]+$/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isExtension = (value: unknown): value is string =>
  typeof value === "string" && EXTENSION_PATTERN.test(value);

const isDimension = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const isStoredSource = (value: unknown): value is StoredSource =>
  isRecord(value) &&
  typeof value.type === "string" &&
  isExtension(value.extension);

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const parseSidecar = (raw: string, hash: string): StoredImage | null => {
  const data = parseJson(raw);

  if (
    !isRecord(data) ||
    data.version !== SIDECAR_VERSION ||
    data.hash !== hash
  ) {
    return null;
  }

  if (data.kind === "plain") {
    return { kind: "plain" };
  }

  if (
    data.kind !== "picture" ||
    !Array.isArray(data.sources) ||
    !data.sources.every(isStoredSource) ||
    !isExtension(data.fallbackExtension) ||
    !isDimension(data.width) ||
    !isDimension(data.height)
  ) {
    return null;
  }

  return {
    kind: "picture",
    sources: data.sources.map(({ type, extension }: StoredSource) => ({
      type,
      extension,
    })),
    fallbackExtension: data.fallbackExtension,
    width: data.width,
    height: data.height,
  };
};

const serializeSidecar = (hash: string, image: StoredImage): string =>
  `${JSON.stringify({ version: SIDECAR_VERSION, hash, ...image }, null, 2)}\n`;

/** Extensions of the variant files an entry owns besides its sidecar. */
const variantExtensions = (image: StoredImage): readonly string[] =>
  image.kind === "picture"
    ? [
        ...image.sources.map(source => source.extension),
        image.fallbackExtension,
      ]
    : [];

export { parseSidecar, serializeSidecar, variantExtensions, SIDECAR_EXTENSION };
export type { StoredImage, StoredSource };
