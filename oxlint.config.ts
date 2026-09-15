import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: [
    "node",
    "react",
    "import",
    "typescript",
    "unicorn",
    "oxc",
    "jsx-a11y",
    "promise",
    "react-perf",
  ],
  categories: {
    correctness: "error",
    suspicious: "error",
    pedantic: "warn",
    perf: "warn",
  },
  options: {
    reportUnusedDisableDirectives: "error",
    respectEslintDisableDirectives: true,
    typeAware: true,
    typeCheck: true,
  },
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  ignorePatterns: ["dist", "out", ".next"],
  rules: {
    "max-lines-per-function": "off",
    "no-console": "warn",
    "no-alert": "error",
    "prefer-const": "error",
    "default-case": "error",
    "object-shorthand": "error",
    "no-unused-private-class-members": "warn",
    "no-promise-executor-return": "error",
    "no-unmodified-loop-condition": "warn",
    eqeqeq: ["error", "smart"],
    "no-duplicate-imports": ["error", { includeExports: true }],
    "import/extensions": [
      "error",
      "always",
      {
        ignorePackages: true,
        checkTypeImports: true,
        ts: true,
        tsx: true,
        css: true,
        json: true,
        pathGroupOverrides: [
          { pattern: "@repo/**", action: "ignore" },
          { pattern: "./.next/types/**/*.d.ts", action: "ignore" },
        ],
      },
    ],
    "import/no-cycle": "error",
    "import/no-unassigned-import": [
      "error",
      {
        allow: [
          "**/*.css",
          "**/*.scss",
          "**/*.sass",
          "**/*.d.ts",
          ".next/types/**/*.ts",
        ],
      },
    ],
    "react/react-in-jsx-scope": "off",
    "typescript/unbound-method": "off",
    "typescript/prefer-readonly-parameter-types": "off",
    "typescript/consistent-type-imports": [
      "error",
      { fixStyle: "inline-type-imports" },
    ],
    "no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
  },
  overrides: [
    {
      files: ["**/scripts/**", "oxlint.config.ts"],
      env: { node: true },
      rules: {
        "no-console": "off",
        "max-lines": "off",
      },
    },

    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
      rules: {
        // `node:test`'s `it`/`test`/`describe` return promises by design.
        "no-floating-promises": "off",
      },
    },

    /* ------------------------------------------------------------------
       DDD / CLEAN ARCHITECTURE BOUNDARIES
       ------------------------------------------------------------------
       Inner layers never reach outer ones. Peer modules never import
       each other directly — they communicate through `application/ports/`.
       See AGENTS.md "Module Boundaries".
       ------------------------------------------------------------------ */

    // `src/app/` is the composition root. It assembles routes from
    // `modules/*/presentation/` and may import `@repo/shared/*`. Anything
    // else is forbidden.
    {
      files: ["src/app/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: [
                  "@repo/modules/*/domain/**",
                  "@repo/modules/*/infrastructure/**",
                ],
                message:
                  "app/ composes from modules/*/presentation. Reach modules through their public surface, not by reaching into inner layers.",
              },
              {
                group: ["**/content/compiled/**"],
                message:
                  "Compiled content is consumed through modules/blog/application, not directly.",
              },
              {
                group: ["../content/**", "./content/**"],
                message:
                  "app/ does not own content. Use modules/blog/presentation instead.",
              },
            ],
          },
        ],
      },
    },

    // `src/shared/` has no domain knowledge. It imports nothing from
    // `modules/` and nothing from `app/`.
    {
      files: ["src/shared/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: [
                  "@repo/app/**",
                  "@repo/modules/**",
                  "../app/**",
                  "../modules/**",
                ],
                message:
                  "shared/ has no domain knowledge. Move this code into a module or app/.",
              },
            ],
          },
        ],
      },
    },

    // Every module's `domain/` is the most inner. It imports nothing
    // outside the module.
    {
      files: ["src/modules/*/domain/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: [
                  "@repo/app/**",
                  "@repo/shared/**",
                  "@repo/modules/**",
                  "../app/**",
                  "../shared/**",
                  "../modules/**",
                ],
                message:
                  "domain/ imports nothing outside its own module. It must be pure types and value objects.",
              },
            ],
          },
        ],
      },
    },

    // `application/` may import `shared/` and own `domain/`. It may declare
    // ports but cannot reach into another module's layers.
    {
      files: ["src/modules/*/application/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["@repo/app/**", "../app/**"],
                message:
                  "application/ does not depend on app/. Compose from presentation/ instead.",
              },
              {
                group: [
                  "@repo/modules/*/domain/**",
                  "@repo/modules/*/application/**",
                  "@repo/modules/*/infrastructure/**",
                  "@repo/modules/*/presentation/**",
                ],
                message:
                  "application/ may not import another module's layers. Declare a port in your own application/ports/.",
              },
              {
                group: ["../../infrastructure/**", "../infrastructure/**"],
                message:
                  "application/ does not depend on infrastructure/. Depend on a port defined here, then wire the adapter in app/.",
              },
              {
                group: ["../../presentation/**", "../presentation/**"],
                message: "application/ does not depend on presentation/.",
              },
            ],
          },
        ],
      },
    },

    // `infrastructure/` provides adapters. It may import shared/, own
    // domain/, own application/, AND peer modules' application/ports/ only.
    {
      files: ["src/modules/*/infrastructure/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["@repo/app/**", "../app/**"],
                message: "infrastructure/ does not depend on app/.",
              },
              {
                group: [
                  "@repo/modules/*/infrastructure/**",
                  "@repo/modules/*/presentation/**",
                ],
                message:
                  "infrastructure/ may not reach into a peer module's infrastructure or presentation. Use ports only.",
              },
              {
                group: ["../../presentation/**", "../presentation/**"],
                message: "infrastructure/ does not depend on presentation/.",
              },
            ],
          },
        ],
      },
    },

    // `presentation/` consumes application/ + domain/. It NEVER imports
    // its own infrastructure/ — the composition root wires adapters via DI.
    // EXCEPTION: a single `*-provider.tsx` file (the module's composition
    // root) may import its own infrastructure/ to wire the adapter.
    {
      files: ["src/modules/*/presentation/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["@repo/app/**", "../app/**"],
                message: "presentation/ does not depend on app/.",
              },
              {
                group: [
                  "@repo/modules/*/infrastructure/**",
                  "../../infrastructure/**",
                  "../infrastructure/**",
                ],
                message:
                  "presentation/ never imports its own infrastructure/. The single exception is a *-provider.tsx file (the module's composition root).",
              },
              {
                group: [
                  "@repo/modules/*/domain/**",
                  "@repo/modules/*/application/**",
                  "@repo/modules/*/presentation/**",
                ],
                message:
                  "presentation/ may only import its own domain/ and application/. Cross-module references go through ports or shared/.",
              },
            ],
          },
        ],
      },
    },

    // `*-provider.tsx` is the module's composition root. It MAY import its
    // own infrastructure/ to wire the adapter.
    {
      files: [
        "src/modules/*/presentation/**/*-provider.{ts,tsx}",
        "src/modules/*/presentation/**/*-module.{ts,tsx}",
      ],
      rules: {
        "no-restricted-imports": "off",
      },
    },
  ],
});
