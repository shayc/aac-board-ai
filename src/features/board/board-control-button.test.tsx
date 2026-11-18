import { buttonClasses } from "@mui/material/Button";
import { useColorScheme } from "@mui/material/styles";
import {
  contrastRatio,
  paint,
  WCAG_NON_TEXT_CONTRAST,
} from "@shared/testing/contrast";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { BoardControlButton } from "./board-control-button";

const TRANSPARENT = "rgba(0, 0, 0, 0)";

type ColorMode = "light" | "dark";

async function measureRoundButton(mode: ColorMode) {
  const screen = await renderWithProviders(
    <>
      <ColorModeSwitch mode={mode} />
      <BoardControlButton shape="round">Go back</BoardControlButton>
    </>,
  );
  await screen.getByRole("button", { name: `Use ${mode} mode` }).click();
  await expect.poll(() => document.documentElement.className).toBe(mode);

  const button = screen.getByRole("button", { name: "Go back" }).element();
  // Switching modes animates the colors; measure where they settle.
  await Promise.all(
    button.getAnimations({ subtree: true }).map(({ finished }) => finished),
  );

  const pageColor = getComputedStyle(document.body).backgroundColor;
  const { backgroundColor, borderTopColor, borderTopWidth } =
    getComputedStyle(button);
  await screen.unmount();

  return {
    fill: backgroundColor,
    ringWidth: borderTopWidth,
    ringContrast: contrastRatio(
      paint(pageColor, borderTopColor),
      paint(pageColor),
    ),
  };
}

function ColorModeSwitch({ mode }: { mode: ColorMode }) {
  const { setMode } = useColorScheme();

  return (
    <button type="button" onClick={() => setMode(mode)}>
      Use {mode} mode
    </button>
  );
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
    expect(ringWidth).toBe("1px");
    expect(ringContrast).toBeGreaterThan(WCAG_NON_TEXT_CONTRAST);
  });

  test("keeps its fill and has no ring in light mode", async () => {
    const { fill, ringWidth } = await measureRoundButton("light");

    expect(fill).not.toBe(TRANSPARENT);
    expect(ringWidth).toBe("0px");
  });
});
