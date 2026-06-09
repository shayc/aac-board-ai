import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { AppearanceSettings } from "./appearance-settings";

describe("AppearanceSettings", () => {
  test("offers the three theme modes with system preselected, with no a11y violations", async () => {
    const screen = await render(
      <AppProviders>
        <AppearanceSettings />
      </AppProviders>,
    );

    await expect
      .element(screen.getByRole("radio", { name: "System" }))
      .toBeChecked();
    await expect
      .element(screen.getByRole("radio", { name: "Light" }))
      .not.toBeChecked();

    await screen.getByRole("radio", { name: "Dark" }).click();

    await expect
      .element(screen.getByRole("radio", { name: "Dark" }))
      .toBeChecked();

    await expectNoA11yViolations(screen.container);
  });
});
