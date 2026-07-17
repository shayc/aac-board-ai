import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { BoardSettings } from "./board-settings";

describe("BoardSettings", () => {
  test("renders the board controls with no a11y violations", async () => {
    const screen = await render(
      <AppProviders>
        <BoardSettings />
      </AppProviders>,
    );

    const saturationSlider = screen.getByRole("slider", {
      name: "Tile color intensity",
    });

    await expect.element(saturationSlider).toBeVisible();
    expect(saturationSlider.element().getAttribute("aria-valuenow")).toBe("1");

    const bordersSwitch = screen.getByRole("switch", {
      name: "Show tile borders",
    });

    await expect.element(bordersSwitch).not.toBeChecked();

    await expectNoA11yViolations(screen.container);
  });

  test("toggling the tile-borders switch persists the borderVisible setting", async () => {
    const screen = await render(
      <AppProviders>
        <BoardSettings />
      </AppProviders>,
    );

    const bordersSwitch = screen.getByRole("switch", {
      name: "Show tile borders",
    });

    await expect.element(bordersSwitch).not.toBeChecked();
    await bordersSwitch.click();
    await expect.element(bordersSwitch).toBeChecked();

    await vi.waitFor(() => {
      const stored = localStorage.getItem("tile-color-config");
      expect(stored).not.toBeNull();
      const config = JSON.parse(stored ?? "{}") as {
        borderVisible: boolean;
      };
      expect(config.borderVisible).toBe(true);
    });
  });

  test("lowering the color-intensity slider persists the saturation setting", async () => {
    const screen = await render(
      <AppProviders>
        <BoardSettings />
      </AppProviders>,
    );

    const saturationSlider = screen.getByRole("slider", {
      name: "Tile color intensity",
    });

    saturationSlider.element().focus();
    await userEvent.keyboard("{ArrowLeft}");

    const valueNow = Number(
      saturationSlider.element().getAttribute("aria-valuenow"),
    );
    expect(valueNow).toBe(0.9);

    await vi.waitFor(() => {
      const stored = localStorage.getItem("tile-color-config");
      expect(stored).not.toBeNull();
      const config = JSON.parse(stored ?? "{}") as { saturation: number };
      expect(config.saturation).toBe(valueNow);
    });
  });
});
