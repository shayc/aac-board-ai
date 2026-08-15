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
  message:
    "@mui package roots are barrels — use a subpath, e.g. @mui/material/Button.",
};

// Re-seed in every block: no-restricted-imports replaces (not merges) across configs.
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
      "react-x/no-array-index-key": "off",
      "no-restricted-imports": restrictImports(),
      curly: "error",
    },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictImports({
        group: ["@app/*", "@features/*", "@pages/*"],
        message:
          "@shared is a leaf layer — it imports nothing from @app, @features, or @pages.",
      }),
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictImports({
        group: ["@app/*", "@features/*", "@pages/*"],
        message:
          "A feature is isolated from @app, @pages, and other features — use @shared (e.g. @shared/testing) or relative paths within the feature.",
      }),
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}", "src/pages/**/*.{ts,tsx}"],
    ignores: ["src/app/**/*.test.{ts,tsx}", "src/pages/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictImports({
        regex: "^@features/[^/]+/.+",
        message:
          "A feature's internals and testing API are private — use its barrel, e.g. @features/board.",
      }),
    },
  },
  {
    files: ["src/app/**/*.test.{ts,tsx}", "src/pages/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictImports({
        regex: "^@features/[^/]+/(?!testing$).+",
        message:
          "A feature's internals are private — use its barrel (@features/board) or test entry (@features/board/testing).",
      }),
    },
  },
  {
    files: ["src/app/routing/loaders/**/*-loader.ts"],
    rules: {
      "@typescript-eslint/only-throw-error": "off",
    },
  },
]);
