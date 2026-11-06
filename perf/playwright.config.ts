import { defineConfig } from "@playwright/test";
import baseConfig from "../playwright.config.ts";

export default defineConfig(baseConfig, {
  testDir: ".",
  outputDir: "../perf-results/test-results",
  timeout: 15 * 60_000,
  retries: 0,
  reporter: "list",
  use: {
    channel: "chromium",
    actionTimeout: 15_000,
    trace: "off",
    screenshot: "off",
    launchOptions: {
      // Only the preview server is reachable; anything else fails fast and
      // shows up as a failed request.
      args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"],
    },
  },
});
