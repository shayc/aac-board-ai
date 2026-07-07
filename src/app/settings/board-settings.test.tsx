import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { BoardSettings } from "./board-settings";

describe("BoardSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("toggles the highlight-while-speaking switch with no a11y violations", async () => {
    const screen = await render(
      <AppProviders>
        <BoardSettings />
      </AppProviders>,
    );

    const highlightSwitch = screen.getByRole("switch", {
      name: "Highlight words while speaking",
    });

    await expect.element(highlightSwitch).not.toBeChecked();
    await highlightSwitch.click();
    await expect.element(highlightSwitch).toBeChecked();

    const saturationSlider = screen.getByRole("slider", {
      name: "Color intensity",
    });

    await expect.element(saturationSlider).toBeVisible();
    expect(saturationSlider.element().getAttribute("aria-valuenow")).toBe("1");

    await expectNoA11yViolations(screen.container);
  });

  test("lowering the color-intensity slider persists the saturation setting", async () => {
    const screen = await render(
      <AppProviders>
        <BoardSettings />
      </AppProviders>,
    );

    const saturationSlider = screen.getByRole("slider", {
      name: "Color intensity",
    });

    saturationSlider.element().focus();
    await userEvent.keyboard("{ArrowLeft}");

    const valueNow = Number(
      saturationSlider.element().getAttribute("aria-valuenow"),
    );
    expect(valueNow).toBeLessThan(1);

    await vi.waitFor(() => {
      const stored = localStorage.getItem("tile-color-config");
      expect(stored).not.toBeNull();
      const config = JSON.parse(stored ?? "{}") as { saturation: number };
      expect(config.saturation).toBe(valueNow);
    });
  });
});
