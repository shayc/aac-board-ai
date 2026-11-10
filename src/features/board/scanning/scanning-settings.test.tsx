import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { setScanningEnabled } from "./scanning-preferences-store";
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
  test("shows only the switch until scanning is turned on", async () => {
    const screen = await renderScanningSettings();
    const enabledSwitch = screen.getByRole("switch", {
      name: "Use switch scanning",
    });

    await expect.element(enabledSwitch).not.toBeChecked();
    expect(screen.getByRole("radiogroup").query()).toBeNull();

    await enabledSwitch.click();

    await expect
      .element(screen.getByRole("radio", { name: "Auto scan" }))
      .toBeChecked();
    await expect
      .element(screen.getByRole("radio", { name: "Row-column" }))
      .toBeChecked();
    await vi.waitFor(() =>
      expect(readStoredPreferences()).toMatchObject({ isEnabled: true }),
    );
    await expectNoA11yViolations(screen.container);
  });

  test("shows the auto scan timing with its defaults", async () => {
    setScanningEnabled(true);
    const screen = await renderScanningSettings();

    await expect
      .element(screen.getByRole("slider", { name: "Scan time" }))
      .toHaveAttribute("aria-valuenow", "1.5");
    await expect
      .element(screen.getByRole("slider", { name: "Delay on first item" }))
      .toHaveAttribute("aria-valuenow", "0.5");
    await expect
      .element(screen.getByRole("slider", { name: "Number of scans" }))
      .toHaveAttribute("aria-valuetext", "3");
    await expect
      .element(screen.getByRole("slider", { name: "Ignore repeated presses" }))
      .toHaveAttribute("aria-valuetext", "Off");
    await expect.element(screen.getByText(/moves on its own/)).toBeVisible();
  });

  test("hides the auto scan timing and names the keys in step scan", async () => {
    setScanningEnabled(true);
    const screen = await renderScanningSettings();

    await screen.getByRole("radio", { name: "Step scan" }).click();

    await expect
      .element(screen.getByText(/Space to move the highlight/))
      .toBeVisible();
    expect(
      screen.getByRole("slider", { name: "Scan time" }).query(),
    ).toBeNull();
    expect(
      screen.getByRole("slider", { name: "Number of scans" }).query(),
    ).toBeNull();
    await expect
      .element(screen.getByRole("slider", { name: "Ignore repeated presses" }))
      .toBeVisible();
    await vi.waitFor(() =>
      expect(readStoredPreferences()).toMatchObject({ method: "step" }),
    );
  });

  test("saves the chosen scan pattern", async () => {
    setScanningEnabled(true);
    const screen = await renderScanningSettings();

    await screen.getByRole("radio", { name: "Linear" }).click();

    await vi.waitFor(() =>
      expect(readStoredPreferences()).toMatchObject({ pattern: "linear" }),
    );
  });
});
