import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { ThemeSettings } from "./theme-settings";

describe("ThemeSettings", () => {
  test("keeps repeated theme controls synchronized with no a11y violations", async () => {
    const screen = await render(
      <AppProviders>
        <ThemeSettings />
        <ThemeSettings />
      </AppProviders>,
    );

    const groups = screen.getByRole("radiogroup", { name: "Theme" }).all();
    expect(groups).toHaveLength(2);
    expect(
      new Set(
        groups.map((group) => group.element().getAttribute("aria-labelledby")),
      ).size,
    ).toBe(2);

    for (const group of groups) {
      await expect
        .element(group.getByRole("radio", { name: "System" }))
        .toBeChecked();
      await expect
        .element(group.getByRole("radio", { name: "Light" }))
        .not.toBeChecked();
    }

    await groups[0].getByRole("radio", { name: "Dark" }).click();

    for (const group of groups) {
      await expect
        .element(group.getByRole("radio", { name: "Dark" }))
        .toBeChecked();
    }

    await expectNoA11yViolations(screen.container);
  });
});
