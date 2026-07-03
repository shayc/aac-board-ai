import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { BoardSettings } from "./board-settings";

describe("BoardSettings", () => {
  test("toggles the highlight-while-speaking switch with no a11y violations", async () => {
    const screen = await render(
      <AppProviders>
        <BoardSettings />
      </AppProviders>,
    );

    const highlightSwitch = screen.getByRole("switch", {
      name: "Highlight words while speaking",
    });

    await expect.element(highlightSwitch).not.toBeChecked();
    await highlightSwitch.click();
    await expect.element(highlightSwitch).toBeChecked();

    await expectNoA11yViolations(screen.container);
  });
});
