import { paraglideVitePlugin } from "@inlang/paraglide-js";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { coverageConfigDefaults } from "vitest/config";
import {
  CONTENT_DARK,
  CONTENT_LIGHT,
  SHELL_DARK,
  SHELL_LIGHT,
} from "./src/shared/theme/theme-colors";

// Share theme-colors.ts with index.html's static styles instead of duplicating hex.
const themeColorHtmlPlugin: Plugin = {
  name: "theme-color-html",
  transformIndexHtml: (html) =>
    html
      .replaceAll("__SHELL_LIGHT__", SHELL_LIGHT)
      .replaceAll("__SHELL_DARK__", SHELL_DARK)
      .replaceAll("__CONTENT_LIGHT__", CONTENT_LIGHT)
      .replaceAll("__CONTENT_DARK__", CONTENT_DARK),
};

export default defineConfig({
  plugins: [
    themeColorHtmlPlugin,
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      strategy: ["globalVariable", "baseLocale"],
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["board.svg"],
      manifest: {
        name: "AAC Board AI",
        short_name: "AAC Board",
        description:
          "AAC Board AI helps people who can't speak communicate naturally with Built-in AI — proofreading, rephrasing, and translating safely on their device.",
        start_url: "/",
        display: "standalone",
        file_handlers: [
          {
            action: "/",
            accept: {
              "application/zip": [".obz", ".zip"],
              "application/json": [".obf", ".json"],
            },
          },
        ],
        theme_color: SHELL_DARK,
        background_color: CONTENT_DARK,
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
    alias: {
      "@app": path.resolve(__dirname, "./src/app"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@paraglide": path.resolve(__dirname, "./src/paraglide"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
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
    setupFiles: ["./src/shared/testing/global-setup.ts"],
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    coverage: {
      exclude: [
        ...coverageConfigDefaults.exclude,
        "src/paraglide/**",
        "**/testing/**",
        "**/test-utils.*",
      ],
      // Regression floor ~2 points under the measured baseline; ratchet up
      // alongside meaningful coverage gains, never down.
      thresholds: {
        statements: 89,
        branches: 78,
        functions: 92,
        lines: 93,
      },
    },
  },
});
