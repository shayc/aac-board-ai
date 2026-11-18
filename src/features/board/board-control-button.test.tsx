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
import type { ComponentProps } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { BoardControlButton } from "./board-control-button";

const TRANSPARENT = "rgba(0, 0, 0, 0)";
const NO_RING = "0px";

type RoundButtonProps = Pick<
  ComponentProps<typeof BoardControlButton>,
  "color" | "disabled"
>;

async function measureRoundButton(mode: ColorMode, props?: RoundButtonProps) {
  const screen = await renderInColorMode(
    <BoardControlButton {...props} shape="round">
      Go back
    </BoardControlButton>,
    mode,
  );

  const button = screen.getByRole("button", { name: "Go back" }).element();
  // Switching modes animates the colors; measure where they settle.
  await Promise.all(
    button.getAnimations({ subtree: true }).map(({ finished }) => finished),
  );

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
    const screen = await render(
      <BoardControlButton className="custom-control">
        Go back
      </BoardControlButton>,
    );

    const button = screen.getByRole("button", { name: "Go back" });

    await expect.element(button).toHaveClass("custom-control");
    await expect.element(button).not.toHaveClass(buttonClasses.disabled);
  });

  test("applies a caller's sx array without losing its own width", async () => {
    const screen = await render(
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
    const screen = await render(
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

describe("BoardControlButton beside the message bar", () => {
  // The bar stays light in dark mode, so it is the row's only filled surface
  // there; the ring is then the button's only edge.
  test("draws a ring with non-text contrast instead of a fill in dark mode", async () => {
    const { fill, ringWidth, ringContrast } = await measureRoundButton("dark");

    expect(fill).toBe(TRANSPARENT);
    expect(ringWidth).not.toBe(NO_RING);
    expect(ringContrast).toBeGreaterThan(WCAG_NON_TEXT_CONTRAST);
  });

  test("dims the ring with its icon when disabled in dark mode", async () => {
    const { fill, iconColor, ringColor, ringWidth } = await measureRoundButton(
      "dark",
      { disabled: true },
    );

    expect(fill).toBe(TRANSPARENT);
    expect(ringWidth).not.toBe(NO_RING);
    expect(ringColor).toBe(iconColor);
  });

  test("keeps the fill of a button with its own color in dark mode", async () => {
    const { fill, ringWidth } = await measureRoundButton("dark", {
      color: "primary",
    });

    expect(fill).not.toBe(TRANSPARENT);
    expect(ringWidth).toBe(NO_RING);
  });

  test("keeps its fill and has no ring in light mode", async () => {
    const { fill, ringWidth } = await measureRoundButton("light");

    expect(fill).not.toBe(TRANSPARENT);
    expect(ringWidth).toBe(NO_RING);
  });
});
