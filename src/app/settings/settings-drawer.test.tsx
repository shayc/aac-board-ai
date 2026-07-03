import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import {
  stubProofreader,
  stubRewriter,
  stubTranslator,
} from "@shared/testing/built-in-ai";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SettingsDrawer } from "./settings-drawer";

describe("SettingsDrawer", () => {
  test("renders every settings section when open, with no a11y violations", async () => {
    stubProofreader();
    stubRewriter();
    stubTranslator();

    const screen = await render(
      <AppProviders>
        <SettingsDrawer open onClose={vi.fn()} />
      </AppProviders>,
    );

    await expect.element(screen.getByText("Settings")).toBeInTheDocument();

    await expect
      .element(screen.getByRole("heading", { name: "Appearance" }))
      .toBeInTheDocument();
    await expect.element(screen.getByText("Theme")).toBeInTheDocument();
    await expect
      .element(screen.getByRole("combobox", { name: "Language" }))
      .toBeInTheDocument();

    await expect
      .element(screen.getByRole("heading", { name: "Speech" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("combobox", { name: "Voice" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("switch", { name: "Highlight while playing" }))
      .toBeInTheDocument();

    await expect
      .element(screen.getByRole("heading", { name: "Suggestions" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .toBeInTheDocument();

    await expect
      .element(screen.getByRole("heading", { name: "About" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("link", { name: /Source code/i }))
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
