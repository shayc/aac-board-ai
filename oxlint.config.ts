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

type RestrictedImports = ["error", { patterns: ImportPattern[] }];

function restrictImports(...patterns: ImportPattern[]): RestrictedImports {
  return [
    "error",
    { patterns: [muiBarrelRestriction, indexedDBRestriction, ...patterns] },
  ];
}

// Each feature lists the features whose barrels it may import. The graph is
// acyclic: board → language-help → library.
const featureDependencies = {
  board: ["language-help", "library"],
  "language-help": ["library"],
  library: [],
} satisfies Record<string, string[]>;

type Feature = keyof typeof featureDependencies;

function featureBoundary(
  feature: Feature,
  { isTest }: { isTest: boolean },
): ImportPattern {
  const dependencies: string[] = featureDependencies[feature];
  const barrels = dependencies.map((name) => `!@features/${name}`);
  const testEntries = dependencies.map((name) => `!@features/${name}/testing`);
  const allowed =
    dependencies.length > 0
      ? `the barrels of ${dependencies.join(" and ")}`
      : "no other feature";

  return {
    group: [
      "@app/**",
      "@pages/**",
      "@features/**",
      ...barrels,
      ...(isTest ? testEntries : []),
    ],
    message: `The ${feature} feature is isolated from @app and @pages and may import ${allowed}${isTest ? " (and their /testing entries)" : ""} — otherwise use @shared or relative paths within the feature.`,
  };
}

function featureOverrides(feature: Feature) {
  const files = `src/features/${feature}/**/*.{ts,tsx}`;
  const testFiles = `src/features/${feature}/**/*.test.{ts,tsx}`;
  const testingFiles = `src/features/${feature}/testing/**/*.{ts,tsx}`;

  return [
    {
      files: [files],
      excludeFiles: [testFiles, testingFiles],
      rules: {
        "no-restricted-imports": restrictImports(
          featureBoundary(feature, { isTest: false }),
        ),
      },
    },
    {
      files: [testFiles, testingFiles],
      rules: {
        "no-restricted-imports": restrictImports(
          featureBoundary(feature, { isTest: true }),
        ),
      },
    },
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
    ...featureOverrides("board"),
    ...featureOverrides("language-help"),
    ...featureOverrides("library"),
    {
      // The only modules that may open the database: storage, and the test
      // helpers that reset and corrupt it.
      files: [
        "src/features/library/storage/**/*.{ts,tsx}",
        "src/features/library/testing/db.ts",
      ],
      rules: {
        "no-restricted-globals": "off",
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              muiBarrelRestriction,
              featureBoundary("library", { isTest: false }),
            ],
          },
        ],
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
            "A feature's internals are private — use its barrel (@features/library) or test entry (@features/library/testing).",
        }),
      },
    },
  ],
});
