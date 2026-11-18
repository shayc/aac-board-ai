import { buttonClasses } from "@mui/material/Button";
import {
  contrastRatio,
  paint,
  WCAG_NON_TEXT_CONTRAST,
} from "@shared/testing/contrast";
import {
  type ColorMode,
  renderInColorMode,
} from "@shared/testing/render-in-color-mode";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import type { ComponentProps } from "react";
import { describe, expect, test } from "vitest";
import { BoardControlButton } from "./board-control-button";

const TRANSPARENT = "rgba(0, 0, 0, 0)";
const NO_RING = "0px";

type MeasuredProps = Pick<
  ComponentProps<typeof BoardControlButton>,
  "color" | "disabled" | "shape"
>;

async function measureButton(mode: ColorMode, props?: MeasuredProps) {
  const screen = await renderInColorMode(
    <BoardControlButton {...props}>Go back</BoardControlButton>,
    mode,
  );

  const button = screen.getByRole("button", { name: "Go back" }).element();

  const pageColor = getComputedStyle(document.body).backgroundColor;
  const { backgroundColor, borderTopColor, borderTopWidth, color } =
    getComputedStyle(button);
  await screen.unmount();

  return {
    fill: backgroundColor,
    iconColor: color,
    ringColor: borderTopColor,
    ringWidth: borderTopWidth,
    ringContrast: contrastRatio(
      paint(pageColor, borderTopColor),
      paint(pageColor),
    ),
  };
}

describe("BoardControlButton", () => {
  test("keeps the caller's class when the button is enabled", async () => {
    const screen = await renderWithProviders(
      <BoardControlButton className="custom-control">
        Go back
      </BoardControlButton>,
    );

    const button = screen.getByRole("button", { name: "Go back" });

    await expect.element(button).toHaveClass("custom-control");
    await expect.element(button).not.toHaveClass(buttonClasses.disabled);
  });

  test("applies a caller's sx array without losing its own width", async () => {
    const screen = await renderWithProviders(
      <BoardControlButton
        sx={[{ mt: 1 }, (theme) => ({ mb: theme.spacing(2) })]}
      >
        Go back
      </BoardControlButton>,
    );

    const button = screen.getByRole("button", { name: "Go back" });

    await expect.element(button).toHaveStyle({
      width: "88px",
      marginTop: "8px",
      marginBottom: "16px",
    });
  });

  test("preserves the caller's class when the button is disabled", async () => {
    const screen = await renderWithProviders(
      <BoardControlButton className="custom-control" disabled>
        Go back
      </BoardControlButton>,
    );

    const button = screen.getByRole("button", { name: "Go back" });

    await expect
      .element(button)
      .toHaveClass("custom-control", buttonClasses.disabled);
  });
});

describe("BoardControlButton colors", () => {
  // The message bar stays light in dark mode, so it is the board's only
  // filled surface besides play; the ring is then the button's only edge.
  test.each(["pill", "round"] as const)(
    "draws a %s button in dark mode with a ring of non-text contrast and no fill",
    async (shape) => {
      const { fill, ringWidth, ringContrast } = await measureButton("dark", {
        shape,
      });

      expect(fill).toBe(TRANSPARENT);
      expect(ringWidth).not.toBe(NO_RING);
      expect(ringContrast).toBeGreaterThan(WCAG_NON_TEXT_CONTRAST);
    },
  );

  test("dims the ring with its icon when disabled in dark mode", async () => {
    const { fill, iconColor, ringColor, ringWidth } = await measureButton(
      "dark",
      { disabled: true },
    );

    expect(fill).toBe(TRANSPARENT);
    expect(ringWidth).not.toBe(NO_RING);
    expect(ringColor).toBe(iconColor);
  });

  // Play is a board control below the grid on a phone.
  test("keeps the fill of a button with its own color in dark mode", async () => {
    const { fill, ringWidth } = await measureButton("dark", {
      color: "primary",
    });

    expect(fill).not.toBe(TRANSPARENT);
    expect(ringWidth).toBe(NO_RING);
  });

  test("keeps its fill and has no ring in light mode", async () => {
    const { fill, ringWidth } = await measureButton("light");

    expect(fill).not.toBe(TRANSPARENT);
    expect(ringWidth).toBe(NO_RING);
  });
});
