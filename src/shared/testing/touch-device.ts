// Types the Playwright provider's CDP session.
import type {} from "@vitest/browser-playwright";
import { onTestFinished } from "vitest";
import { cdp } from "vitest/browser";

// Makes `(hover: none)` match, which the test browser's mouse never does.
export async function emulateTouchDevice(): Promise<void> {
  onTestFinished(() => setTouchEmulation(false));

  await setTouchEmulation(true);
}

async function setTouchEmulation(enabled: boolean): Promise<void> {
  await cdp().send("Emulation.setTouchEmulationEnabled", { enabled });
}
