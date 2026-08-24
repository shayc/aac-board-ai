import { defineConfig } from "oxlint";

type ImportPattern = {
  group: string[];
  message: string;
};

const muiBarrelRestriction: ImportPattern = {
  group: ["@mui/*", "!@mui/stylis-plugin-rtl"],
  message:
    "@mui package roots are barrels — use a subpath, e.g. @mui/material/Button.",
};

function restrictImports(
  ...patterns: ImportPattern[]
): ["error", { patterns: ImportPattern[] }] {
  return ["error", { patterns: [muiBarrelRestriction, ...patterns] }];
}

export default defineConfig({
  categories: {
    correctness: "error",
  },
  env: {
    browser: true,
  },
  ignorePatterns: ["coverage/**", "dist/**", "src/paraglide/**"],
  options: {
    denyWarnings: true,
    reportUnusedDisableDirectives: "error",
    typeAware: true,
  },
  plugins: [
    "eslint",
    "import",
    "jsx-a11y",
    "oxc",
    "react",
    "typescript",
    "unicorn",
    "vitest",
  ],
  rules: {
    curly: "error",
    "no-restricted-imports": restrictImports(),
    // ARIA grids and MUI primitives intentionally express semantics without table-specific elements.
    "jsx-a11y/prefer-tag-over-role": "off",
    "react/only-export-components": ["error", { allowConstantExport: true }],
    "react/rules-of-hooks": "error",
    "react/unsupported-syntax": "error",
    "typescript/no-explicit-any": "error",
    "typescript/no-misused-promises": "error",
    "typescript/no-unsafe-argument": "error",
    "typescript/no-unsafe-assignment": "error",
    "typescript/no-unsafe-call": "error",
    "typescript/no-unsafe-member-access": "error",
    "typescript/no-unsafe-return": "error",
    "vitest/require-mock-type-parameters": "off",
    "vitest/require-to-throw-message": "off",
    "vitest/valid-expect": ["error", { maxArgs: 2 }],
  },
  overrides: [
    {
      files: ["*.config.ts"],
      env: {
        browser: false,
        node: true,
      },
    },
    {
      files: ["src/**/*.test.{ts,tsx}"],
      env: {
        vitest: true,
      },
      rules: {
        "vitest/expect-expect": [
          "error",
          {
            assertFunctionNames: ["expect", "assert", "expectNoA11yViolations"],
          },
        ],
      },
    },
    {
      files: ["src/shared/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": restrictImports({
          group: ["@app/**", "@features/**", "@pages/**"],
          message:
            "@shared is a leaf layer — it imports nothing from @app, @features, or @pages.",
        }),
      },
    },
    {
      files: ["src/features/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": restrictImports({
          group: ["@app/**", "@features/**", "@pages/**"],
          message:
            "A feature is isolated from @app, @pages, and other features — use @shared (e.g. @shared/testing) or relative paths within the feature.",
        }),
      },
    },
    {
      files: ["src/app/**/*.{ts,tsx}", "src/pages/**/*.{ts,tsx}"],
      excludeFiles: [
        "src/app/**/*.test.{ts,tsx}",
        "src/pages/**/*.test.{ts,tsx}",
      ],
      rules: {
        "no-restricted-imports": restrictImports({
          group: ["@features/*/**"],
          message:
            "A feature's internals and testing API are private — use its barrel, e.g. @features/board.",
        }),
      },
    },
    {
      files: ["src/app/**/*.test.{ts,tsx}", "src/pages/**/*.test.{ts,tsx}"],
      rules: {
        "no-restricted-imports": restrictImports({
          group: ["@features/*/**", "!@features/*/testing"],
          message:
            "A feature's internals are private — use its barrel (@features/board) or test entry (@features/board/testing).",
        }),
      },
    },
  ],
});
