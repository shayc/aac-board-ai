import { buttonClasses } from "@mui/material/Button";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { BoardControlButton } from "./board-control-button";

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
