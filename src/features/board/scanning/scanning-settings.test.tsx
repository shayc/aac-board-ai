import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { ScanningSettings } from "./scanning-settings";

async function renderScanningSettings() {
  return render(
    <AppProviders>
      <ScanningSettings />
    </AppProviders>,
  );
}

function readStoredPreferences(): unknown {
  return JSON.parse(localStorage.getItem("scanning-preferences") ?? "null");
}

describe("ScanningSettings", () => {
  test("shows only the scanning switch while scanning is off", async () => {
    const screen = await renderScanningSettings();

    await expect
      .element(screen.getByRole("switch", { name: "Enable switch scanning" }))
      .not.toBeChecked();
    await expect
      .element(screen.getByRole("radiogroup", { name: "Scan method" }))
      .not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("slider", { name: "Scan interval" }))
      .not.toBeInTheDocument();
  });

  test("turns scanning on with the automatic method and its switch keys explained", async () => {
    const screen = await renderScanningSettings();

    await screen
      .getByRole("switch", { name: "Enable switch scanning" })
      .click();

    await expect
      .element(screen.getByRole("radio", { name: "Automatic" }))
      .toBeChecked();
    await expect
      .element(screen.getByRole("radiogroup", { name: "Scan method" }))
      .toHaveAccessibleDescription(
        "Press Space or Enter to start scanning and to select. Scanning pauses after two passes.",
      );
    await vi.waitFor(() =>
      expect(readStoredPreferences()).toMatchObject({ isEnabled: true }),
    );

    await expectNoA11yViolations(screen.container);
  });

  test("switches to the two-switch step method, which has no scan interval", async () => {
    const screen = await renderScanningSettings();

    await screen
      .getByRole("switch", { name: "Enable switch scanning" })
      .click();
    await screen.getByRole("radio", { name: "Two-switch step" }).click();

    await expect
      .element(screen.getByRole("radiogroup", { name: "Scan method" }))
      .toHaveAccessibleDescription(
        "Press Space to move to the next item and Enter to select it.",
      );
    await expect
      .element(screen.getByRole("slider", { name: "Scan interval" }))
      .not.toBeInTheDocument();
    await vi.waitFor(() =>
      expect(readStoredPreferences()).toMatchObject({ method: "step" }),
    );
  });

  test("changes the scan interval in steps of a tenth of a second", async () => {
    const screen = await renderScanningSettings();

    await screen
      .getByRole("switch", { name: "Enable switch scanning" })
      .click();
    const intervalSlider = screen.getByRole("slider", {
      name: "Scan interval",
    });
    await expect
      .element(intervalSlider)
      .toHaveAttribute("aria-valuenow", "1200");

    intervalSlider.element().focus();
    await userEvent.keyboard("{ArrowRight}");

    await expect
      .element(intervalSlider)
      .toHaveAttribute("aria-valuenow", "1300");
    await vi.waitFor(() =>
      expect(readStoredPreferences()).toMatchObject({ intervalMs: 1300 }),
    );
  });
});
