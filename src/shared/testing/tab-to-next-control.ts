import { server, userEvent } from "vitest/browser";

// WebKit on macOS skips native controls without a tabindex on plain Tab;
// Option+Tab reaches every control.
const DOES_TAB_SKIP_NATIVE_CONTROLS =
  server.browser === "webkit" && server.platform === "darwin";

export async function tabToNextControl() {
  if (DOES_TAB_SKIP_NATIVE_CONTROLS) {
    await userEvent.keyboard("{Alt>}{Tab}{/Alt}");

    return;
  }

  await userEvent.tab();
}
