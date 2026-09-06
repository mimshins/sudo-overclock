import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["react", "import", "vitest", "typescript", "unicorn", "oxc"],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  env: {
    es6: true,
    node: true,
  },
  ignorePatterns: ["dist", "src/gen/contracts"],
  rules: {
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
      { ignorePackages: true, checkTypeImports: true },
    ],
    "import/no-cycle": "error",
    "react/react-in-jsx-scope": "off",
    "typescript/unbound-method": "off",
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
      files: ["**/scripts/**"],
      env: { node: true },
      rules: { "no-console": "off" },
    },
    {
      files: ["**/__tests__/**"],
      plugins: ["vitest"],
    },
    {
      files: ["**/*.{test,spec}.{ts,tsx}"],
      plugins: ["vitest"],
    },
  ],
});
