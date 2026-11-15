import { server, userEvent } from "vitest/browser";

// Safari on macOS moves Tab between text fields only unless the user turns on
// full keyboard access; Option+Tab reaches every control.
const SKIPS_CONTROLS_ON_TAB =
  server.browser === "webkit" && server.platform === "darwin";

export async function tabToNextControl() {
  if (SKIPS_CONTROLS_ON_TAB) {
    await userEvent.keyboard("{Alt>}{Tab}{/Alt}");

    return;
  }

  await userEvent.tab();
}
