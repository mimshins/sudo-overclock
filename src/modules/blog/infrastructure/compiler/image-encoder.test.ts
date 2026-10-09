import assert from "node:assert/strict";

import { describe, it } from "vitest";

import { buildEncoderId, sharpImageEncoder } from "./image-encoder.ts";

const base = {
  sharpVersion: "0.35.4",
  vipsVersion: "8.18.6",
  recipe: { transform: { maxWidth: 2048 }, encode: { formats: ["avif"] } },
};

describe("buildEncoderId", () => {
  it("is stable for the same versions and recipe", () => {
    assert.equal(buildEncoderId(base), buildEncoderId({ ...base }));
  });

  it("changes when the encode recipe changes", () => {
    const changed = buildEncoderId({
      ...base,
      recipe: {
        transform: { maxWidth: 2048 },
        encode: { formats: ["avif", "webp"] },
      },
    });

    assert.notEqual(changed, buildEncoderId(base));
  });

  it("changes when the encoder versions change", () => {
    assert.notEqual(
      buildEncoderId({ ...base, vipsVersion: "8.19.0" }),
      buildEncoderId(base),
    );
  });

  it("names the sharp and libvips versions and a recipe fingerprint", () => {
    assert.match(
      buildEncoderId(base),
      /^sharp-0\.35\.4-vips-8\.18\.6-r[a-f0-9]{8}$/u,
    );
  });
});

describe("sharpImageEncoder", () => {
  it("carries a recipe fingerprint in its id", () => {
    assert.match(sharpImageEncoder.id, /^sharp-.+-vips-.+-r[a-f0-9]{8}$/u);
  });
});
