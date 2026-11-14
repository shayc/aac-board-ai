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

    const themeGroups = screen.getByRole("group", { name: "Theme" });
    const groups = themeGroups.all();
    const firstDarkButton = themeGroups
      .first()
      .getByRole("button", { name: "Dark" });
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

    await firstDarkButton.click();

    for (const group of groups) {
      await expect
        .element(group.getByRole("button", { name: "Dark" }))
        .toHaveAttribute("aria-pressed", "true");
    }

    await expect
      .element(firstDarkButton.getByTestId("CheckIcon"))
      .toBeInTheDocument();
    await expect
      .element(
        themeGroups
          .first()
          .getByRole("button", { name: "System" })
          .getByTestId("CheckIcon"),
      )
      .not.toBeInTheDocument();

    await firstDarkButton.click();

    await expect
      .element(firstDarkButton)
      .toHaveAttribute("aria-pressed", "true");

    await expectNoA11yViolations(screen.container);
  });
});
