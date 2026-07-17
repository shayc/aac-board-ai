import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SwitchScanningSettings } from "./switch-scanning-settings";

function renderSettings() {
  return render(
    <AppProviders>
      <SwitchScanningSettings />
    </AppProviders>,
  );
}

describe("SwitchScanningSettings", () => {
  test("keeps scanning opt-in and explains the default switch input", async () => {
    const screen = await renderSettings();

    await expect
      .element(screen.getByRole("switch", { name: "Enable switch scanning" }))
      .not.toBeChecked();
    await expect
      .element(screen.getByRole("combobox", { name: "Scan method" }))
      .toBeDisabled();
    await expect
      .element(screen.getByText("Press Space or Enter to select."))
      .toBeVisible();
    await expect
      .element(screen.getByRole("slider", { name: "Scan interval" }))
      .toBeDisabled();

    await expectNoA11yViolations(screen.container);
  });

  test("selecting two-switch step removes timing controls and persists the method", async () => {
    const screen = await renderSettings();

    await screen
      .getByRole("switch", { name: "Enable switch scanning" })
      .click();
    await screen.getByRole("combobox", { name: "Scan method" }).click();
    await expect.element(screen.getByText("One switch")).toBeVisible();
    await expect.element(screen.getByText("Two switches")).toBeVisible();
    await screen
      .getByRole("option", { name: "Two-switch step scan, Two switches" })
      .click();

    await expect
      .element(screen.getByText("Press Space to move and Enter to select."))
      .toBeVisible();
    await expect.element(screen.getByRole("slider")).not.toBeInTheDocument();

    await vi.waitFor(() => {
      const stored = localStorage.getItem("switch-scanning-config");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored ?? "{}")).toMatchObject({
        enabled: true,
        method: "step",
      });
    });
  });

  test("shows dwell timing only for single-switch step scan", async () => {
    const screen = await renderSettings();

    await screen
      .getByRole("switch", { name: "Enable switch scanning" })
      .click();
    await screen.getByRole("combobox", { name: "Scan method" }).click();
    await screen
      .getByRole("option", {
        name: "Single-switch step scan, One switch",
      })
      .click();

    await expect
      .element(screen.getByRole("slider", { name: "Dwell time" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("slider", { name: "Scan interval" }))
      .not.toBeInTheDocument();
  });
});
