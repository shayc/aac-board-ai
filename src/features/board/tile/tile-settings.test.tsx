import { setCommunicationLanguage } from "@shared/language/language-store";
import { assertDefined } from "@shared/testing/assert-defined";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { readStoredPreferences } from "@shared/testing/stored-preferences";
import { tabToNextControl } from "@shared/testing/tab-to-next-control";
import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { setTileLabelPlacement } from "./tile-preferences-store";
import { TileSettings } from "./tile-settings";

describe("TileSettings", () => {
  test("has no accessibility violations", async () => {
    const screen = await renderWithProviders(<TileSettings />);
    await expect
      .element(screen.getByRole("slider", { name: "Color intensity" }))
      .toBeVisible();

    await expectNoA11yViolations(screen.container);
  });

  test("renders the tile controls", async () => {
    const screen = await renderWithProviders(<TileSettings />);

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
  });

  test("formats color intensity in the UI locale when the language has no UI translation", async () => {
    setCommunicationLanguage("fa");

    const screen = await renderWithProviders(<TileSettings />);

    await expect
      .element(screen.getByRole("slider", { name: "Color intensity" }))
      .toHaveAttribute("aria-valuetext", "100%");
  });

  test.each([
    { placement: "top", name: "Top" },
    { placement: "bottom", name: "Bottom" },
    { placement: "hidden", name: "Hidden" },
  ] as const)(
    "shows one focus outline around the $name label option while keeping its preview visible",
    async ({ placement, name }) => {
      setTileLabelPlacement(placement);
      const screen = await renderWithProviders(<TileSettings />);

      await tabToNextControl();

      const radio = screen.getByRole("radio", { name });
      await expect.element(radio).toHaveFocus();
      const option = radio.element().parentElement;
      assertDefined(option);
      const symbol = option.querySelector("svg");
      assertDefined(symbol);

      await expect.element(symbol).toBeVisible();
      await expect.element(option).toHaveStyle({ outlineStyle: "solid" });
      await expect
        .element(symbol)
        .toHaveStyle({ outlineStyle: "none", boxShadow: "none" });
    },
  );

  test("persists tile border visibility when toggled", async () => {
    const screen = await renderWithProviders(<TileSettings />);

    const bordersSwitch = screen.getByRole("switch", {
      name: "Show borders",
    });

    await expect.element(bordersSwitch).not.toBeChecked();
    await bordersSwitch.click();

    await expect.element(bordersSwitch).toBeChecked();
    expect(readStoredPreferences("tile-preferences")).toMatchObject({
      areBordersVisible: true,
    });
  });

  test("persists tile saturation when color intensity is lowered", async () => {
    const screen = await renderWithProviders(<TileSettings />);

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
    await expect.element(screen.getByText("90%")).toBeVisible();

    expect(readStoredPreferences("tile-preferences")).toMatchObject({
      saturation: valueNow,
    });
  });

  test("persists tile brightness when brightness is lowered", async () => {
    const screen = await renderWithProviders(<TileSettings />);

    const brightnessSlider = screen.getByRole("slider", { name: "Brightness" });

    brightnessSlider.element().focus();
    await userEvent.keyboard("{ArrowLeft}");

    await expect
      .element(brightnessSlider)
      .toHaveAttribute("aria-valuetext", "97%");
    await expect.element(screen.getByText("97%")).toBeVisible();

    expect(readStoredPreferences("tile-preferences")).toMatchObject({
      brightness: 0.97,
    });
  });

  test.each([
    { name: "Brightness", lowest: "70%" },
    { name: "Color intensity", lowest: "0%" },
  ])("lowers $name to $lowest in ten steps", async ({ name, lowest }) => {
    const screen = await renderWithProviders(<TileSettings />);

    const slider = screen.getByRole("slider", { name });

    slider.element().focus();
    await userEvent.keyboard("{ArrowLeft>9/}");
    await expect.element(slider).not.toHaveAttribute("aria-valuetext", lowest);

    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(slider).toHaveAttribute("aria-valuetext", lowest);
  });

  test("keeps repeated label position controls synchronized and persists the choice", async () => {
    const screen = await renderWithProviders(
      <>
        <TileSettings />
        <TileSettings />
      </>,
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

    expect(readStoredPreferences("tile-preferences")).toMatchObject({
      labelPlacement: "bottom",
    });
  });
});
