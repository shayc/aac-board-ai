import { defineConfig, devices } from "@playwright/test";

const PWA_PREVIEW_URL = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: PWA_PREVIEW_URL,
    locale: "en-US",
    serviceWorkers: "allow",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: PWA_PREVIEW_URL,
    reuseExistingServer: false,
  },
});
