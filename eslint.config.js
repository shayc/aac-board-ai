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
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^@mui/(?!stylis-plugin-rtl)[^/]+$",
              message: "Import from subpaths, e.g. @mui/material/Button",
            },
          ],
        },
      ],
      curly: ["error"],
    },
  },
  {
    files: ["src/app/loaders/**/*-loader.ts"],
    rules: {
      "@typescript-eslint/only-throw-error": "off",
    },
  },
]);
