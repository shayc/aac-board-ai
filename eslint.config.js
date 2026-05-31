import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import reactDom from "eslint-plugin-react-dom";
import reactHooks from "eslint-plugin-react-hooks";
import reactJsx from "eslint-plugin-react-jsx";
import { reactRefresh } from "eslint-plugin-react-refresh";
import reactX from "eslint-plugin-react-x";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const muiSubpaths = {
  regex: "^@mui/(?!stylis-plugin-rtl)[^/]+$",
  message: "Import from subpaths, e.g. @mui/material/Button",
};

// no-restricted-imports replaces (not merges) across overrides, so every block
// builds its patterns here — keeping muiSubpaths in one place it can't be dropped.
const restrictImports = (...patterns) => [
  "error",
  { patterns: [muiSubpaths, ...patterns] },
];

export default defineConfig([
  globalIgnores(["dist", "coverage", "src/paraglide"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactX.configs["recommended-typescript"],
      reactDom.configs.recommended,
      reactJsx.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite(),
      eslintConfigPrettier,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: "latest",
      globals: globals.browser,
    },
    rules: {
      "padding-line-between-statements": [
        "error",
        // Always require a blank line before returns
        { blankLine: "always", prev: "*", next: "return" },

        // Always require a blank line after block-like statements (if, for, switch, etc.)
        { blankLine: "always", prev: ["block", "block-like"], next: "*" },
      ],
      "react-x/no-array-index-key": "off",
      "no-restricted-imports": restrictImports(),
      curly: ["error"],
    },
  },
  {
    files: ["src/app/loaders/**/*-loader.ts"],
    rules: {
      "@typescript-eslint/only-throw-error": "off",
    },
  },

  // Layer boundaries (architecture.md §2).
  {
    files: ["src/features/**/*.{ts,tsx}"],
    ignores: ["src/features/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictImports({
        group: ["@app", "@app/*", "@features", "@features/*"],
        message:
          "A feature must not import @app or another feature — use @shared or relative paths within the feature.",
      }),
    },
  },
  {
    // Feature tests may compose the real app shell, but still never another feature.
    files: ["src/features/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictImports({
        group: ["@features", "@features/*"],
        message: "Even in tests, a feature must not import another feature.",
      }),
    },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictImports({
        group: [
          "@app",
          "@app/*",
          "@features",
          "@features/*",
          "@pages",
          "@pages/*",
        ],
        message: "@shared is a leaf layer — no @app, @features, or @pages.",
      }),
    },
  },
  {
    // @app / @pages consume a feature through its barrel (@features/board) or its
    // sanctioned test entry (@features/board/testing) — never deeper internals.
    files: ["src/app/**/*.{ts,tsx}", "src/pages/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictImports({
        regex: "^@features/[^/]+/(?!testing$).+",
        message:
          "Consume features through their barrel (@features/board) or test entry (@features/board/testing), not internal paths.",
      }),
    },
  },
]);
