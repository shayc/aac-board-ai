import { paraglideVitePlugin } from "@inlang/paraglide-js";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import type { Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { coverageConfigDefaults, defineConfig } from "vitest/config";
import { BOARD_FILE_EXTENSIONS_BY_MIME_TYPE } from "./src/features/board/import/board-file-formats.ts";
import {
  BACKGROUND_DARK,
  BACKGROUND_LIGHT,
} from "./src/shared/theme/theme-colors.ts";

// Share theme-colors.ts with index.html's static styles instead of duplicating hex.
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
    react({ compiler: true }),
    paraglideVitePlugin({
      project: "./project.inlang",
      outputStructure: "message-modules",
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["board.svg", "first-words.obz"],
      workbox: {
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
          "A free communication board for people who cannot rely on speech. Tap symbols to build a message and hear it spoken aloud, with optional on-device AI suggestions.",
        start_url: "/",
        display: "standalone",
        file_handlers: [
          { action: "/", accept: BOARD_FILE_EXTENSIONS_BY_MIME_TYPE },
        ],
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
      "@mui/icons-material/*",
      "@mui/material/*",
      "@mui/stylis-plugin-rtl",
      "@mui/utils/*",
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
    setupFiles: ["./src/shared/testing/global-setup.ts"],
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        ...coverageConfigDefaults.exclude,
        "src/paraglide/**",
        "**/testing/**",
        "**/test-utils.*",
      ],
      // Regression floor ~2 points under the measured baseline; ratchet up
      // alongside meaningful coverage gains, never down.
      thresholds: {
        statements: 95,
        branches: 88,
        functions: 94,
        lines: 94,
      },
    },
  },
});
