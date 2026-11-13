import { buttonClasses } from "@mui/material/Button";
import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { BoardControlButton } from "./board-control-button";

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
