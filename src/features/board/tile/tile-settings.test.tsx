import { setStoredLanguage } from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import { assertDefined } from "@shared/testing/assert-defined";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { TileSettings } from "./tile-settings";

describe("TileSettings", () => {
  test("renders the tile controls with no accessibility violations", async () => {
    const screen = await render(
      <AppProviders>
        <TileSettings />
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

    const brightnessSlider = screen.getByRole("slider", { name: "Brightness" });

    await expect.element(brightnessSlider).toBeVisible();
    await expect
      .element(brightnessSlider)
      .toHaveAttribute("aria-valuetext", "100%");
    await expect.element(screen.getByText("100%")).not.toBeInTheDocument();

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

  test("formats color intensity in the UI locale when the language has no UI translation", async () => {
    setStoredLanguage("fa");

    const screen = await render(
      <AppProviders>
        <TileSettings />
      </AppProviders>,
    );

    await expect
      .element(screen.getByRole("slider", { name: "Color intensity" }))
      .toHaveAttribute("aria-valuetext", "100%");
  });

  test("shows one focus outline around each label option while keeping its preview visible", async () => {
    const screen = await render(
      <AppProviders>
        <TileSettings />
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

  test("persists tile border visibility when toggled", async () => {
    const screen = await render(
      <AppProviders>
        <TileSettings />
      </AppProviders>,
    );

    const bordersSwitch = screen.getByRole("switch", {
      name: "Show borders",
    });

    await expect.element(bordersSwitch).not.toBeChecked();
    await bordersSwitch.click();
    await expect.element(bordersSwitch).toBeChecked();

    await vi.waitFor(() => {
      const stored = localStorage.getItem("tile-preferences");
      expect(stored).not.toBeNull();
      const preferences = JSON.parse(stored ?? "{}") as {
        areBordersVisible: boolean;
      };
      expect(preferences.areBordersVisible).toBe(true);
    });
  });

  test("persists tile saturation when color intensity is lowered", async () => {
    const screen = await render(
      <AppProviders>
        <TileSettings />
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
    await expect
      .element(saturationSlider)
      .toHaveAttribute("aria-valuetext", "90%");

    await vi.waitFor(() => {
      const stored = localStorage.getItem("tile-preferences");
      expect(stored).not.toBeNull();
      const preferences = JSON.parse(stored ?? "{}") as {
        saturation: number;
      };
      expect(preferences.saturation).toBe(valueNow);
    });
  });

  test("persists tile brightness when brightness is lowered", async () => {
    const screen = await render(
      <AppProviders>
        <TileSettings />
      </AppProviders>,
    );

    const brightnessSlider = screen.getByRole("slider", { name: "Brightness" });

    brightnessSlider.element().focus();
    await userEvent.keyboard("{ArrowLeft}");

    await expect
      .element(brightnessSlider)
      .toHaveAttribute("aria-valuetext", "97%");

    await vi.waitFor(() => {
      const stored = localStorage.getItem("tile-preferences");
      expect(stored).not.toBeNull();
      const preferences = JSON.parse(stored ?? "{}") as {
        brightness: number;
      };
      expect(preferences.brightness).toBe(0.97);
    });
  });

  test.each([
    { name: "Brightness", lowest: "70%" },
    { name: "Color intensity", lowest: "0%" },
  ])("lowers $name to $lowest in ten steps", async ({ name, lowest }) => {
    const screen = await render(
      <AppProviders>
        <TileSettings />
      </AppProviders>,
    );

    const slider = screen.getByRole("slider", { name });

    slider.element().focus();
    await userEvent.keyboard("{ArrowLeft>9/}");
    await expect.element(slider).not.toHaveAttribute("aria-valuetext", lowest);

    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(slider).toHaveAttribute("aria-valuetext", lowest);
  });

  test("keeps repeated label position controls synchronized and persists the choice", async () => {
    const screen = await render(
      <AppProviders>
        <TileSettings />
        <TileSettings />
      </AppProviders>,
    );

    const groups = screen.getByRole("radiogroup", { name: "Labels" }).all();
    expect(groups).toHaveLength(2);
    expect(
      new Set(
        groups.map((group) => group.element().getAttribute("aria-labelledby")),
      ).size,
    ).toBe(2);

    const [firstGroup] = groups;

    assertDefined(firstGroup);

    const bottomRadio = firstGroup.getByRole("radio", { name: "Bottom" });

    await expect.element(bottomRadio).not.toBeChecked();
    await bottomRadio.click();
    for (const group of groups) {
      await expect
        .element(group.getByRole("radio", { name: "Bottom" }))
        .toBeChecked();
    }

    await vi.waitFor(() => {
      const stored = localStorage.getItem("tile-preferences");
      expect(stored).not.toBeNull();
      const preferences = JSON.parse(stored ?? "{}") as {
        labelPlacement: string;
      };
      expect(preferences.labelPlacement).toBe("bottom");
    });
  });
});
