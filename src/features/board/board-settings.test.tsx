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
      name: "Color intensity",
    });
    const bordersSwitch = screen.getByRole("switch", {
      name: "Show borders",
    });

    await expect.element(saturationSlider).toBeVisible();
    expect(saturationSlider.element().getAttribute("aria-valuenow")).toBe("1");
    await expect
      .element(saturationSlider)
      .toHaveAttribute("aria-valuetext", "100%");
    await expect.element(screen.getByText("100%")).toBeVisible();

    await expect.element(bordersSwitch).not.toBeChecked();
    await expect
      .element(screen.getByRole("radio", { name: "Top" }))
      .toBeChecked();
    await expect
      .element(screen.getByRole("radio", { name: "Bottom" }))
      .not.toBeChecked();
    await expect
      .element(screen.getByRole("radio", { name: "Hidden" }))
      .not.toBeChecked();

    await expectNoA11yViolations(screen.container);
  });

  test("shows one focus outline around each label option while keeping its preview visible", async () => {
    const screen = await render(
      <AppProviders>
        <BoardSettings />
      </AppProviders>,
    );

    await userEvent.tab();

    for (const name of ["Top", "Bottom", "Hidden"]) {
      const radio = screen.getByRole("radio", { name });
      await expect.element(radio).toHaveFocus();
      await expect.element(radio).toBeChecked();

      const option = radio.element().parentElement;
      const symbol = option?.querySelector("svg");
      if (!option || !symbol) {
        throw new Error("Label options must include a preview symbol");
      }

      await expect.element(symbol).toBeVisible();
      await expect.element(option).toHaveStyle({ outlineStyle: "solid" });
      await expect
        .element(symbol)
        .toHaveStyle({ outlineStyle: "none", boxShadow: "none" });

      await userEvent.keyboard("{ArrowRight}");
    }
  });

  test("toggling tile borders persists their visibility", async () => {
    const screen = await render(
      <AppProviders>
        <BoardSettings />
      </AppProviders>,
    );

    const bordersSwitch = screen.getByRole("switch", {
      name: "Show borders",
    });

    await expect.element(bordersSwitch).not.toBeChecked();
    await bordersSwitch.click();
    await expect.element(bordersSwitch).toBeChecked();

    await vi.waitFor(() => {
      const stored = localStorage.getItem("board-preferences");
      expect(stored).not.toBeNull();
      const preferences = JSON.parse(stored ?? "{}") as {
        areTileBordersVisible: boolean;
      };
      expect(preferences.areTileBordersVisible).toBe(true);
    });
  });

  test("lowering color intensity persists tile saturation", async () => {
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
    expect(valueNow).toBe(0.9);
    await expect.element(screen.getByText("90%")).toBeVisible();

    await vi.waitFor(() => {
      const stored = localStorage.getItem("board-preferences");
      expect(stored).not.toBeNull();
      const preferences = JSON.parse(stored ?? "{}") as {
        tileSaturation: number;
      };
      expect(preferences.tileSaturation).toBe(valueNow);
    });
  });

  test("changing the tile label position updates repeated controls and persists", async () => {
    const screen = await render(
      <AppProviders>
        <BoardSettings />
        <BoardSettings />
      </AppProviders>,
    );

    const groups = screen.getByRole("radiogroup", { name: "Labels" }).all();
    expect(groups).toHaveLength(2);
    expect(
      new Set(
        groups.map((group) => group.element().getAttribute("aria-labelledby")),
      ).size,
    ).toBe(2);

    const bottomRadio = groups[0].getByRole("radio", { name: "Bottom" });

    await expect.element(bottomRadio).not.toBeChecked();
    await bottomRadio.click();
    for (const group of groups) {
      await expect
        .element(group.getByRole("radio", { name: "Bottom" }))
        .toBeChecked();
    }

    await vi.waitFor(() => {
      const stored = localStorage.getItem("board-preferences");
      expect(stored).not.toBeNull();
      const preferences = JSON.parse(stored ?? "{}") as {
        tileLabelPlacement: string;
      };
      expect(preferences.tileLabelPlacement).toBe("bottom");
    });
  });
});
