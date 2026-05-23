/// <reference types="vitest/config" />
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      strategy: ["globalVariable", "baseLocale"],
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["board.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "AAC Board AI",
        short_name: "AAC Board",
        description:
          "AAC Board AI helps people who can't speak communicate naturally with Built-in AI — proofreading, rephrasing, and translating safely on their device.",
        start_url: "/",
        display: "standalone",
        theme_color: "#222222",
        background_color: "#222222",
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
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@paraglide": path.resolve(__dirname, "./src/paraglide"),
    },
  },
  optimizeDeps: {
    include: [
      "@mui/material/*",
      "@mui/icons-material/*",
      "@emotion/cache",
      "@emotion/react",
      "@mui/stylis-plugin-rtl",
      "react-dom/client",
      "react-router/dom",
      "stylis",
    ],
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      // https://vitest.dev/guide/browser/playwright
      instances: [{ browser: "chromium" }],
    },
  },
});
