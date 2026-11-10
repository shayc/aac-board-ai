import { defineConfig } from "@playwright/test";
import baseConfig from "../playwright.config.ts";
import { DIST_DIRS, IS_PROFILING } from "./results.ts";

export const ACTION_TIMEOUT_MS = 15_000;
export const BASE_BUILD_URL = "http://127.0.0.1:4174";

// The inherited web server serves the working tree's build at the inherited
// baseURL; this one serves the build of the ref it is compared with.
const baseBuildServer = {
  command: `npx vite preview --outDir "${DIST_DIRS.base}" --host 127.0.0.1 --port 4174 --strictPort`,
  url: BASE_BUILD_URL,
  reuseExistingServer: false,
};

export default defineConfig(baseConfig, {
  testDir: ".",
  testMatch: "journeys.spec.ts",
  outputDir: "../perf-results/test-results",
  timeout: 30 * 60_000,
  retries: 0,
  reporter: "list",
  use: {
    channel: "chromium",
    actionTimeout: ACTION_TIMEOUT_MS,
    trace: "off",
    screenshot: "off",
    launchOptions: {
      // Only the preview servers are reachable; anything else fails fast and
      // shows up as a failed request.
      args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"],
    },
  },
  webServer: IS_PROFILING ? [] : [baseBuildServer],
});
