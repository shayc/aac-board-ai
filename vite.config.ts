import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { VitePWA } from "@unplugin-pwa/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import type { Plugin } from "vite";
import { coverageConfigDefaults, defineConfig } from "vitest/config";
import { BOARD_FILE_EXTENSIONS_BY_MIME_TYPE } from "./src/features/library/import/board-file-formats.ts";
import {
  BACKGROUND_DARK,
  BACKGROUND_LIGHT,
} from "./src/shared/theme/theme-colors.ts";

const SCREENSHOT_LABEL =
  "The First Words board with “I want more” in the message bar and the suggestion “I'd like more.”";

const themeColorHtmlPlugin: Plugin = {
  name: "theme-color-html",
  transformIndexHtml: (html) =>
    html
      .replaceAll("__BACKGROUND_LIGHT__", BACKGROUND_LIGHT)
      .replaceAll("__BACKGROUND_DARK__", BACKGROUND_DARK),
};

export default defineConfig({
  plugins: [
    themeColorHtmlPlugin,
    react({ compiler: { panicThreshold: "all_errors" } }),
    paraglideVitePlugin({
      project: "./project.inlang",
      outputStructure: "message-modules",
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["board.svg", "first-words.obz"],
      swType: "classic",
      generateSW: {
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: ({ request, sameOrigin }) =>
              !sameOrigin && request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "aac-remote-images",
              // Cross-origin <img> responses are opaque but remain renderable.
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 1000, purgeOnQuotaError: true },
            },
          },
        ],
      },
      manifest: {
        name: "AAC Board AI",
        short_name: "AAC Board",
        description:
          "A free communication board for people who cannot rely on speech. Tap symbols to build a message and hear it spoken aloud. Works offline, with no account, ads or tracking.",
        id: "/",
        start_url: "/",
        display: "standalone",
        file_handlers: [
          { action: "/", accept: BOARD_FILE_EXTENSIONS_BY_MIME_TYPE },
        ],
        launch_handler: { client_mode: "focus-existing" },
        theme_color: BACKGROUND_DARK,
        background_color: BACKGROUND_DARK,
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "screenshot-narrow.png",
            sizes: "780x1688",
            type: "image/png",
            form_factor: "narrow",
            label: SCREENSHOT_LABEL,
          },
          {
            src: "screenshot-wide.png",
            sizes: "1920x1200",
            type: "image/png",
            form_factor: "wide",
            label: SCREENSHOT_LABEL,
          },
        ],
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    include: [
      "@emotion/cache",
      "@emotion/react",
      "@mui/material/*",
      "@mui/stylis-plugin-rtl",
      "@mui/utils/*",
      "@phosphor-icons/react/dist/csr/*",
      "react-dom/client",
      "react-router/dom",
      "stylis",
    ],
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "messages", test: /src\/paraglide\//, priority: 40 },
            {
              name: "react",
              test: /node_modules\/(react|react-dom|scheduler)\//,
              priority: 30,
            },
            {
              name: "mui",
              test: /node_modules\/(@mui|@emotion|stylis)\//,
              priority: 20,
            },
            { name: "shayc", test: /node_modules\/@shayc\//, priority: 20 },
            { name: "vendor", test: /node_modules\//, priority: 10 },
          ],
        },
      },
    },
  },
  test: {
    dir: "src",
    setupFiles: ["./src/shared/testing/setup.ts"],
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }, { browser: "webkit" }],
    },
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        ...coverageConfigDefaults.exclude,
        "src/paraglide/**",
        "**/testing/**",
      ],
      // Raise these floors with meaningful gains, keeping them about two
      // percentage points below measured coverage.
      thresholds: {
        statements: 95,
        branches: 88,
        functions: 94,
        lines: 94,
      },
    },
  },
});
