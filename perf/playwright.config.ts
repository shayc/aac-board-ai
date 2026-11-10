import { defineConfig } from "@playwright/test";
import baseConfig from "../playwright.config.ts";

export const ACTION_TIMEOUT_MS = 15_000;

export default defineConfig(baseConfig, {
  testDir: ".",
  testMatch: "journeys.spec.ts",
  outputDir: "../perf-results/test-results",
  timeout: 15 * 60_000,
  retries: 0,
  reporter: "list",
  use: {
    channel: "chromium",
    actionTimeout: ACTION_TIMEOUT_MS,
    trace: "off",
    screenshot: "off",
    launchOptions: {
      // Only the preview server is reachable; anything else fails fast and
      // shows up as a failed request.
      args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"],
    },
  },
});
