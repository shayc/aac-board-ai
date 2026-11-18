import { buttonClasses } from "@mui/material/Button";
import {
  type ColorMode,
  renderInColorMode,
} from "@shared/testing/render-in-color-mode";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import {
  BoardControlButton,
  type BoardControlShape,
} from "./board-control-button";

const TRANSPARENT = "rgba(0, 0, 0, 0)";

async function measureFill(
  shape: BoardControlShape,
  mode: ColorMode,
  disabled: boolean,
) {
  const screen = await renderInColorMode(
    <BoardControlButton shape={shape} disabled={disabled}>
      Go home
    </BoardControlButton>,
    mode,
  );

  const button = screen.getByRole("button", { name: "Go home" }).element();
  const fill = getComputedStyle(button).backgroundColor;
  await screen.unmount();

  return fill;
}

describe("BoardControlButton", () => {
  test("keeps the caller's class when the button is enabled", async () => {
    const screen = await render(
      <BoardControlButton className="custom-control">
        Go home
      </BoardControlButton>,
    );

    const button = screen.getByRole("button", { name: "Go home" });

    await expect.element(button).toHaveClass("custom-control");
    await expect.element(button).not.toHaveClass(buttonClasses.disabled);
  });

  test("applies a caller's sx array without losing its own width", async () => {
    const screen = await render(
      <BoardControlButton
        sx={[{ mt: 1 }, (theme) => ({ mb: theme.spacing(2) })]}
      >
        Go home
      </BoardControlButton>,
    );

    const button = screen.getByRole("button", { name: "Go home" });

    await expect.element(button).toHaveStyle({
      width: "88px",
      marginTop: "8px",
      marginBottom: "16px",
    });
  });

  test("preserves the caller's class when the button is disabled", async () => {
    const screen = await render(
      <BoardControlButton className="custom-control" disabled>
        Go home
      </BoardControlButton>,
    );

    const button = screen.getByRole("button", { name: "Go home" });

    await expect
      .element(button)
      .toHaveClass("custom-control", buttonClasses.disabled);
  });
});

describe("BoardControlButton shapes", () => {
  test.each([
    { mode: "light", disabled: false },
    { mode: "light", disabled: true },
    { mode: "dark", disabled: false },
    { mode: "dark", disabled: true },
  ] as const)(
    "fills the round button as the pill in $mode mode, disabled: $disabled",
    async ({ mode, disabled }) => {
      const round = await measureFill("round", mode, disabled);
      const pill = await measureFill("pill", mode, disabled);

      expect(round).not.toBe(TRANSPARENT);
      expect(round).toBe(pill);
    },
  );
});
