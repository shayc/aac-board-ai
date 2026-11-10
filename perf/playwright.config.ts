import { defineConfig } from "@playwright/test";
import baseConfig from "../playwright.config.ts";
import { DIST_DIRS } from "./results.ts";

export const ACTION_TIMEOUT_MS = 15_000;
export const BASE_BUILD_URL = "http://127.0.0.1:4174";
export const SAMPLE_COUNT = Number(process.env.PERF_SAMPLES ?? 10);

// A journey test runs one warm-up and SAMPLE_COUNT samples per build. A sample
// takes a few seconds; the budget leaves room for a slow board set download.
const SAMPLE_TIMEOUT_MS = 90_000;
const BUILD_COUNT = 2;

export default defineConfig(baseConfig, {
  testDir: ".",
  testMatch: "journeys.spec.ts",
  outputDir: "../perf-results/test-results",
  timeout: (SAMPLE_COUNT + 1) * BUILD_COUNT * SAMPLE_TIMEOUT_MS,
  retries: 0,
  reporter: "list",
  use: {
    channel: "chromium",
    actionTimeout: ACTION_TIMEOUT_MS,
    trace: "off",
    screenshot: "off",
    launchOptions: {
      // Only the preview servers are reachable; anything else fails fast.
      args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"],
    },
  },
  // The inherited web server serves the working tree's build at the inherited
  // baseURL; this one serves the build of the ref it is compared with. It runs
  // the same npm script, so both servers load the same Vite config.
  webServer: {
    command: `npm run preview -- --outDir "${DIST_DIRS.base}" --host 127.0.0.1 --port 4174 --strictPort`,
    url: BASE_BUILD_URL,
    reuseExistingServer: false,
  },
});
