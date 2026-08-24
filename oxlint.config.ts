import { defineConfig } from "oxlint";

type ImportPattern = {
  group?: string[];
  message: string;
  regex?: string;
};

const muiBarrelRestriction: ImportPattern = {
  regex: "^@mui/(?!stylis-plugin-rtl)[^/]+$",
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
    "react/unsupported-syntax": "error",
    // Contextual prop types already constrain callback mocks; redundant generics obscure test intent.
    "vitest/require-mock-type-parameters": "off",
    // Some tests assert only that an operation rejects, not its incidental browser-generated wording.
    "vitest/require-to-throw-message": "off",
    // Vitest supports a second `expect` argument for diagnostic messages.
    "vitest/valid-expect": "off",
  },
  overrides: [
    {
      files: ["*.config.{js,mjs,ts,mts}", "oxlint.config.ts"],
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
      excludeFiles: [
        "src/app/**/*.test.{ts,tsx}",
        "src/pages/**/*.test.{ts,tsx}",
      ],
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
        "typescript/only-throw-error": "off",
      },
    },
  ],
});
