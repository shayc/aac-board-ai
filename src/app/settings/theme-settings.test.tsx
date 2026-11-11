import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { ThemeSettings } from "./theme-settings";

describe("ThemeSettings", () => {
  test("keeps repeated theme controls synchronized with no accessibility violations", async () => {
    const screen = await render(
      <AppProviders>
        <ThemeSettings />
        <ThemeSettings />
      </AppProviders>,
    );

    const groups = screen.getByRole("group", { name: "Theme" }).all();
    expect(groups).toHaveLength(2);
    expect(
      new Set(
        groups.map((group) => group.element().getAttribute("aria-labelledby")),
      ).size,
    ).toBe(2);

    for (const group of groups) {
      await expect
        .element(group.getByRole("button", { name: "System" }))
        .toHaveAttribute("aria-pressed", "true");
      await expect
        .element(group.getByRole("button", { name: "Light" }))
        .toHaveAttribute("aria-pressed", "false");
    }

    await groups[0]?.getByRole("button", { name: "Dark" }).click();

    for (const group of groups) {
      await expect
        .element(group.getByRole("button", { name: "Dark" }))
        .toHaveAttribute("aria-pressed", "true");
    }

    await groups[0]?.getByRole("button", { name: "Dark" }).click();

    await expect
      .element(groups[0]!.getByRole("button", { name: "Dark" }))
      .toHaveAttribute("aria-pressed", "true");

    await expectNoA11yViolations(screen.container);
  });
});
