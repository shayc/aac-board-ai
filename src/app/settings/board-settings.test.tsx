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
    const labelPositionGroup = screen.getByRole("radiogroup", {
      name: "Tile labels",
    });
    const bordersSwitch = screen.getByRole("switch", {
      name: "Show tile borders",
    });

    await expect.element(saturationSlider).toBeVisible();
    expect(saturationSlider.element().getAttribute("aria-valuenow")).toBe("1");
    await expect
      .element(saturationSlider)
      .toHaveAttribute("aria-valuetext", "100%");
    await expect.element(screen.getByText("100%")).toBeVisible();

    await expect.element(bordersSwitch).not.toBeChecked();
    await expect
      .element(screen.getByRole("radio", { name: "Above image" }))
      .toBeChecked();
    await expect
      .element(screen.getByRole("radio", { name: "Below image" }))
      .not.toBeChecked();
    await expect
      .element(screen.getByRole("radio", { name: "Hidden" }))
      .not.toBeChecked();
    expect(
      labelPositionGroup
        .element()
        .compareDocumentPosition(bordersSwitch.element()),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      bordersSwitch
        .element()
        .compareDocumentPosition(saturationSlider.element()),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    await expectNoA11yViolations(screen.container);
  });

  test("toggling tile borders persists their visibility", async () => {
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
      const stored = localStorage.getItem("board-appearance");
      expect(stored).not.toBeNull();
      const config = JSON.parse(stored ?? "{}") as {
        areTileBordersVisible: boolean;
      };
      expect(config.areTileBordersVisible).toBe(true);
    });
  });

  test("lowering color intensity persists tile saturation", async () => {
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
    await expect.element(screen.getByText("90%")).toBeVisible();

    await vi.waitFor(() => {
      const stored = localStorage.getItem("board-appearance");
      expect(stored).not.toBeNull();
      const config = JSON.parse(stored ?? "{}") as {
        tileSaturation: number;
      };
      expect(config.tileSaturation).toBe(valueNow);
    });
  });

  test("changing the tile label position updates repeated controls and persists", async () => {
    const screen = await render(
      <AppProviders>
        <BoardSettings />
        <BoardSettings />
      </AppProviders>,
    );

    const groups = screen
      .getByRole("radiogroup", { name: "Tile labels" })
      .all();
    expect(groups).toHaveLength(2);
    expect(
      new Set(
        groups.map((group) => group.element().getAttribute("aria-labelledby")),
      ).size,
    ).toBe(2);

    const bottomRadio = groups[0].getByRole("radio", { name: "Below image" });

    await expect.element(bottomRadio).not.toBeChecked();
    await bottomRadio.click();
    for (const group of groups) {
      await expect
        .element(group.getByRole("radio", { name: "Below image" }))
        .toBeChecked();
    }

    await vi.waitFor(() => {
      const stored = localStorage.getItem("board-appearance");
      expect(stored).not.toBeNull();
      const config = JSON.parse(stored ?? "{}") as {
        tileLabelPlacement: string;
      };
      expect(config.tileLabelPlacement).toBe("bottom");
    });
  });
});
