import { defineConfig, devices } from "@playwright/test";
import baseConfig from "../playwright.config.ts";
import { DIST_DIRS } from "./paths.ts";
import {
  ACTION_TIMEOUT_MS,
  BASE_BUILD_URL,
  BUILD_NAMES,
  IS_COMPARISON,
  ROUND_COUNT,
} from "./settings.ts";

const SAMPLE_TIMEOUT_MS = 90_000;

const baseBuildServer = {
  command: `npm run preview -- --outDir "${DIST_DIRS.base}" --host 127.0.0.1 --port 4174 --strictPort`,
  url: BASE_BUILD_URL,
  reuseExistingServer: false,
};

// Replace projects before defineConfig merges them. The probes require Chromium CDP.
const chromiumOnlyBaseConfig = {
  ...baseConfig,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
};

export default defineConfig(chromiumOnlyBaseConfig, {
  testDir: ".",
  testMatch: "journeys.spec.ts",
  outputDir: "../perf-results/test-results",
  timeout: (ROUND_COUNT + 1) * BUILD_NAMES.length * SAMPLE_TIMEOUT_MS,
  retries: 0,
  reporter: "list",
  use: {
    channel: "chromium",
    actionTimeout: ACTION_TIMEOUT_MS,
    navigationTimeout: ACTION_TIMEOUT_MS,
    trace: "off",
    screenshot: "off",
    launchOptions: {
      // Only the preview servers are reachable; anything else fails fast.
      args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"],
    },
  },
  ...(IS_COMPARISON && { webServer: baseBuildServer }),
});
