import Button from "@mui/material/Button";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { describe, expect, test } from "vitest";
import { ThemeSettings } from "./theme-settings";

describe("ThemeSettings", () => {
  test("has no accessibility violations with a theme selected", async () => {
    const screen = await renderWithProviders(<ThemeSettings />);
    const darkButton = screen.getByRole("button", { name: "Dark" });

    await darkButton.click();
    await expect.element(darkButton).toHaveAttribute("aria-pressed", "true");

    await expectNoA11yViolations(screen.container);
  });

  test("keeps repeated theme controls synchronized", async () => {
    const screen = await renderWithProviders(
      <>
        <ThemeSettings />
        <ThemeSettings />
      </>,
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
      .element(firstDarkButton.getByTestId("theme-check"))
      .toBeInTheDocument();
    await expect
      .element(
        themeGroups
          .first()
          .getByRole("button", { name: "System" })
          .getByTestId("theme-check"),
      )
      .not.toBeInTheDocument();

    await firstDarkButton.click();

    await expect
      .element(firstDarkButton)
      .toHaveAttribute("aria-pressed", "true");
  });

  test("switches every control to the new theme at once", async () => {
    const screen = await renderWithProviders(
      <>
        <ThemeSettings />
        <Button variant="contained">Untouched</Button>
      </>,
    );
    const darkButton = screen.getByRole("button", { name: "Dark" });
    const untouchedButton = screen
      .getByRole("button", { name: "Untouched" })
      .element();

    await darkButton.click();

    await expect.element(darkButton).toHaveAttribute("aria-pressed", "true");
    expect(untouchedButton.getAnimations()).toHaveLength(0);
  });
});
