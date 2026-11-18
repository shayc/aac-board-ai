import { server, userEvent } from "vitest/browser";

// Safari on macOS tabs only to text fields and elements with a tabindex unless
// full keyboard access is on; Option+Tab reaches every control.
const DOES_TAB_SKIP_NATIVE_CONTROLS =
  server.browser === "webkit" && server.platform === "darwin";

export async function tabToNextControl() {
  if (DOES_TAB_SKIP_NATIVE_CONTROLS) {
    await userEvent.keyboard("{Alt>}{Tab}{/Alt}");

    return;
  }

  await userEvent.tab();
}
