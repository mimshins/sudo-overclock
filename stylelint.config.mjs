const COLOR_FUNCTIONS = [
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "color",
];

/** @type {import("stylelint").Config} */
export default {
  rules: {
    "color-no-hex": true,
    "color-named": "never",
    "function-disallowed-list": [...COLOR_FUNCTIONS, "color-mix"],
    "unit-disallowed-list": [
      ["ms", "s"],
      {
        message: unit =>
          `Raw duration "${unit}" — use a --duration-* token from globals.css (docs/design-system.md#motion).`,
      },
    ],
    "declaration-property-value-disallowed-list": [
      {
        "/.*/": [
          "/var\\(--color-(neutral|phosphor|positive|negative|warn|info)-\\d+\\)/",
          "/var\\(--color-surface-/",
        ],
      },
      {
        message: () =>
          "Primitive color token — use a semantic token (docs/design-system.md#color).",
      },
    ],
    "declaration-property-value-allowed-list": [
      {
        "/^(letter-spacing|--[\\w-]*letter-spacing)$/": [
          "0",
          "normal",
          "/^var\\(--/",
        ],
        "/^(font-weight|--[\\w-]*-weight)$/": ["/^var\\(--/"],
        "/^(border(-(top|right|bottom|left|block|inline)(-(start|end))?)?|--[\\w-]*border)$/":
          [
            "0",
            "none",
            "/^var\\(--[\\w-]+\\)$/",
            "/^var\\(--border-width-[\\w-]+\\) (solid|dashed) /",
          ],
        "/^(border(-[a-z]+)*-width|--[\\w-]*border[\\w-]*-width)$/": [
          "0",
          "/^var\\(--/",
        ],
      },
      {
        message: property =>
          `Raw "${property}" value — use a --typography-tracking-*, --typography-weight-*, or --border-width-* token (docs/design-system.md#tokens).`,
      },
    ],
  },
  overrides: [
    {
      files: ["src/app/globals.css"],
      rules: {
        "color-no-hex": null,
        "color-named": null,
        "function-disallowed-list": null,
        "unit-disallowed-list": null,
        "declaration-property-value-disallowed-list": null,
        "declaration-property-value-allowed-list": null,
      },
    },
  ],
};
