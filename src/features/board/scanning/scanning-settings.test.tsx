import { expectNoA11yViolations } from "@shared/testing/axe";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { readStoredPreferences } from "@shared/testing/stored-preferences";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { ScanningSettings } from "./scanning-settings";

describe("ScanningSettings", () => {
  test("has no accessibility violations with scanning on", async () => {
    const screen = await renderWithProviders(<ScanningSettings />);

    await screen
      .getByRole("switch", { name: "Enable switch scanning" })
      .click();
    await expect
      .element(screen.getByRole("radiogroup", { name: "Scan method" }))
      .toBeVisible();

    await expectNoA11yViolations(screen.container);
  });

  test("shows only the scanning switch while scanning is off", async () => {
    const screen = await renderWithProviders(<ScanningSettings />);

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
    const screen = await renderWithProviders(<ScanningSettings />);

    await screen
      .getByRole("switch", { name: "Enable switch scanning" })
      .click();

    await expect
      .element(screen.getByRole("radio", { name: "Automatic scanning" }))
      .toBeChecked();
    await expect
      .element(screen.getByRole("radiogroup", { name: "Scan method" }))
      .toHaveAccessibleDescription(
        "Press Space or Enter to start scanning and to select. Scanning pauses after two passes.",
      );
    await vi.waitFor(() =>
      expect(readStoredPreferences("scanning-preferences")).toMatchObject({
        isEnabled: true,
      }),
    );
  });

  test("switches to the two-switch step method, which has no scan interval", async () => {
    const screen = await renderWithProviders(<ScanningSettings />);

    await screen
      .getByRole("switch", { name: "Enable switch scanning" })
      .click();
    await screen.getByRole("radio", { name: "Step scanning" }).click();

    await expect
      .element(screen.getByRole("radiogroup", { name: "Scan method" }))
      .toHaveAccessibleDescription(
        "Press Space to move to the next item and Enter to select it.",
      );
    await expect
      .element(screen.getByRole("slider", { name: "Scan interval" }))
      .not.toBeInTheDocument();
    await vi.waitFor(() =>
      expect(readStoredPreferences("scanning-preferences")).toMatchObject({
        method: "step",
      }),
    );
  });

  test("changes the scan interval in steps of a tenth of a second", async () => {
    const screen = await renderWithProviders(<ScanningSettings />);

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
      expect(readStoredPreferences("scanning-preferences")).toMatchObject({
        intervalMs: 1300,
      }),
    );
  });
});
