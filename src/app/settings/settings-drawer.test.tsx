import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SettingsDrawer } from "./settings-drawer";

describe("SettingsDrawer", () => {
  test("renders every settings section when open, with no a11y violations", async () => {
    const screen = await render(
      <AppProviders>
        <SettingsDrawer open onClose={vi.fn()} />
      </AppProviders>,
    );

    await expect.element(screen.getByText("Settings")).toBeInTheDocument();
    await expect.element(screen.getByText("Theme")).toBeInTheDocument();
    await expect
      .element(screen.getByRole("combobox", { name: "Language" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("combobox", { name: "Voice" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("switch", { name: "Highlight while playing" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Built-in AI support"))
      .toBeInTheDocument();

    await expectNoA11yViolations(document.body);
  });

  test("close button invokes onClose", async () => {
    const onClose = vi.fn();
    const screen = await render(
      <AppProviders>
        <SettingsDrawer open onClose={onClose} />
      </AppProviders>,
    );

    await screen.getByRole("button", { name: "Close settings" }).click();

    expect(onClose).toHaveBeenCalledOnce();
  });
});
