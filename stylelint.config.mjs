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
      },
    },
    {
      files: [
        "src/app/about/about.module.css",
        "src/app/reading/reading.module.css",
        "src/app/site-header.module.css",
        "src/modules/blog/presentation/post-images.module.css",
        "src/modules/blog/presentation/post-list.module.css",
      ],
      rules: {
        "function-disallowed-list": COLOR_FUNCTIONS,
      },
    },
  ],
};
