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

const indexedDBRestriction: ImportPattern = {
  group: ["idb", "idb/**"],
  message:
    "Storage owns all IndexedDB access — go through the library feature's storage module (@features/library from other features).",
};

const builtInAIRestriction: ImportPattern = {
  group: ["@shayc/react-built-in-ai", "@shayc/react-built-in-ai/**"],
  message:
    "Built-in AI is optional — only the board's suggestions and the library's translation may use it, so nothing else comes to depend on a model.",
};

// Packages only their owning folder may import.
const ownedPackageRestrictions = [indexedDBRestriction, builtInAIRestriction];

const boardBoundary: ImportPattern = {
  group: ["@app/**", "@features/**", "!@features/library"],
  message:
    "The board feature is isolated from @app and may import only the library's barrel (@features/library) — otherwise use @shared or relative paths within the feature.",
};

const boardTestBoundary: ImportPattern = {
  group: [...boardBoundary.group, "!@features/library/testing"],
  message:
    "The board feature is isolated from @app and may import only the library's barrel (@features/library) or test entry (@features/library/testing) — otherwise use @shared or relative paths within the feature.",
};

const libraryBoundary: ImportPattern = {
  group: ["@app/**", "@features/**"],
  message:
    "The library feature is isolated from @app and other features — use @shared or relative paths within the feature.",
};

type RestrictedImports = ["error", { patterns: ImportPattern[] }];

function restrictImports(...patterns: ImportPattern[]): RestrictedImports {
  return [
    "error",
    {
      patterns: [
        muiBarrelRestriction,
        ...ownedPackageRestrictions,
        ...patterns,
      ],
    },
  ];
}

function restrictImportsForOwnerOf(
  ownedPackage: ImportPattern,
  ...patterns: ImportPattern[]
): RestrictedImports {
  const otherOwnedPackages = ownedPackageRestrictions.filter(
    (restriction) => restriction !== ownedPackage,
  );

  return [
    "error",
    { patterns: [muiBarrelRestriction, ...otherOwnedPackages, ...patterns] },
  ];
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
    "import/no-duplicates": "error",
    // Oxfmt orders import statements; this orders the names inside each one.
    "sort-imports": [
      "error",
      { ignoreCase: true, ignoreDeclarationSort: true },
    ],
    "no-restricted-globals": [
      "error",
      {
        name: "indexedDB",
        message:
          "Storage owns all IndexedDB access — go through the library feature's storage module.",
      },
    ],
    "no-restricted-imports": restrictImports(),
    // ARIA grids and MUI primitives intentionally express semantics without table-specific elements.
    "jsx-a11y/prefer-tag-over-role": "off",
    "react/only-export-components": ["error", { allowConstantExport: true }],
    "react/rules-of-hooks": "error",
    "react/unsupported-syntax": "error",
    "typescript/no-explicit-any": "error",
    "typescript/no-misused-promises": "error",
    "typescript/no-unnecessary-condition": "error",
    "typescript/no-unsafe-argument": "error",
    "typescript/no-unsafe-assignment": "error",
    "typescript/no-unsafe-call": "error",
    "typescript/no-unsafe-member-access": "error",
    "typescript/no-unsafe-return": "error",
    "unicorn/filename-case": ["error", { case: "kebabCase" }],
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
        "vitest/no-restricted-vi-methods": [
          "error",
          {
            mock: "Tests render the real tree — stub only platform boundaries, with vi.spyOn.",
          },
        ],
      },
    },
    {
      files: ["src/shared/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": restrictImports({
          group: ["@app/**", "@features/**"],
          message:
            "@shared is a leaf layer — it imports nothing from @app or @features.",
        }),
      },
    },
    {
      files: ["src/features/board/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": restrictImports(boardBoundary),
      },
    },
    {
      files: [
        "src/features/board/**/*.test.{ts,tsx}",
        "src/features/board/testing/**/*.{ts,tsx}",
      ],
      rules: {
        "no-restricted-imports": restrictImports(boardTestBoundary),
      },
    },
    {
      files: ["src/features/board/suggestions/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": restrictImportsForOwnerOf(
          builtInAIRestriction,
          boardBoundary,
        ),
      },
    },
    {
      files: ["src/features/board/suggestions/**/*.test.{ts,tsx}"],
      rules: {
        "no-restricted-imports": restrictImportsForOwnerOf(
          builtInAIRestriction,
          boardTestBoundary,
        ),
      },
    },
    {
      files: ["src/features/library/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": restrictImports(libraryBoundary),
      },
    },
    {
      files: ["src/features/library/translation/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": restrictImportsForOwnerOf(
          builtInAIRestriction,
          libraryBoundary,
        ),
      },
    },
    {
      // Test helpers reset and corrupt the database, so they open it too.
      files: [
        "src/features/library/storage/**/*.{ts,tsx}",
        "src/features/library/testing/db.ts",
      ],
      rules: {
        "no-restricted-globals": "off",
        "no-restricted-imports": restrictImportsForOwnerOf(
          indexedDBRestriction,
          libraryBoundary,
        ),
      },
    },
    {
      files: ["src/app/**/*.{ts,tsx}"],
      excludeFiles: ["src/app/**/*.test.{ts,tsx}"],
      rules: {
        "no-restricted-imports": restrictImports({
          group: ["@features/*/**"],
          message:
            "A feature's internals and testing API are private — use its barrel, e.g. @features/board.",
        }),
      },
    },
    {
      files: ["src/app/**/*.test.{ts,tsx}"],
      rules: {
        "no-restricted-imports": restrictImports({
          group: ["@features/*/**", "!@features/*/testing"],
          message:
            "A feature's internals are private — use its barrel (@features/library) or test entry (@features/library/testing).",
        }),
      },
    },
  ],
});
