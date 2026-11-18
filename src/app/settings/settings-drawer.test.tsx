import { backdropClasses } from "@mui/material/Backdrop";
import { assertDefined } from "@shared/testing/assert-defined";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import {
  stubProofreader,
  stubRewriter,
  stubTranslator,
} from "@shared/testing/stub-built-in-ai";
import { stubVoices } from "@shared/testing/stub-speech";
import { describe, expect, test, vi } from "vitest";
import type { RenderResult } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { SettingsDrawer } from "./settings-drawer";

describe("SettingsDrawer", () => {
  test("has no accessibility violations", async () => {
    stubProofreader();
    stubRewriter();
    stubTranslator();

    const screen = await renderWithProviders(
      <SettingsDrawer open onClose={vi.fn()} />,
    );
    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .toBeInTheDocument();

    await expectNoA11yViolations(document.body);
  });

  test("renders every settings section when open", async () => {
    stubProofreader();
    stubRewriter();
    stubTranslator();

    const screen = await renderWithProviders(
      <SettingsDrawer open onClose={vi.fn()} />,
    );

    await expect.element(screen.getByText("Settings")).toBeInTheDocument();

    const drawerItems = [
      screen.getByRole("heading", { name: "Appearance" }),
      screen.getByRole("group", { name: "Theme" }),
      screen.getByRole("heading", { name: "Language & voice" }),
      screen.getByRole("combobox", { name: "Language" }),
      screen.getByRole("combobox", { name: "Voice" }),
      screen.getByRole("button", { name: "Preview voice" }),
      screen.getByRole("heading", { name: "Board" }),
      screen.getByRole("slider", { name: "Color intensity" }),
      screen.getByRole("heading", { name: "Message" }),
      screen.getByRole("switch", { name: "Highlight while playing" }),
      screen.getByRole("heading", { name: "Suggestions" }),
    ];
    for (const item of drawerItems) {
      await expect.element(item).toBeInTheDocument();
    }

    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .toBeInTheDocument();

    await expect
      .element(screen.getByRole("heading", { name: "About" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("link", { name: /Source code/i }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText(/^Version \d+\.\d+\.\d+$/))
      .toBeInTheDocument();
  });

  test("leaves the page undimmed and closes on a click outside", async () => {
    const onClose = vi.fn();
    const screen = await renderWithProviders(
      <SettingsDrawer open onClose={onClose} />,
    );
    await expect
      .element(screen.getByRole("slider", { name: "Brightness" }))
      .toBeInTheDocument();

    const backdrop = document.querySelector(`.${backdropClasses.root}`);
    assertDefined(backdrop);

    expect(getComputedStyle(backdrop).backgroundColor).toBe("rgba(0, 0, 0, 0)");

    // The drawer covers the backdrop's center in a narrow test viewport.
    await userEvent.click(backdrop, { position: { x: 4, y: 4 } });

    expect(onClose).toHaveBeenCalledOnce();
  });

  test("names each section group after its heading", async () => {
    const screen = await renderWithProviders(
      <SettingsDrawer open onClose={vi.fn()} />,
    );

    await expect
      .element(
        screen
          .getByRole("group", { name: "Board" })
          .getByRole("slider", { name: "Color intensity" }),
      )
      .toBeInTheDocument();
    await expect
      .element(
        screen
          .getByRole("group", { name: "Board" })
          .getByRole("switch", { name: "Show borders" }),
      )
      .toBeInTheDocument();
    await expect
      .element(
        screen
          .getByRole("group", { name: "Message" })
          .getByRole("switch", { name: "Highlight while playing" }),
      )
      .toBeInTheDocument();
  });

  test("formats setting values for the selected language", async () => {
    const screen = await renderWithProviders(
      <SettingsDrawer open onClose={vi.fn()} />,
    );

    await screen.getByRole("combobox", { name: "Language" }).click();
    await screen.getByRole("option", { name: "Deutsch" }).click();

    await expect
      .element(screen.getByRole("slider", { name: "Sprechgeschwindigkeit" }))
      .toHaveAttribute("aria-valuetext", "1,0×");
    await expect
      .element(screen.getByRole("slider", { name: "Lautstärke" }))
      .toHaveAttribute("aria-valuetext", expect.stringMatching(/^100\s%$/));
  });

  test("keeps each language's voice when switching languages", async () => {
    stubVoices([
      { voiceURI: "us-1", name: "Samantha", lang: "en-US" },
      { voiceURI: "us-2", name: "Alex", lang: "en-US" },
      { voiceURI: "he-1", name: "Carmit", lang: "he-IL" },
      { voiceURI: "he-2", name: "Ayelet", lang: "he-IL" },
    ]);
    const screen = await renderWithProviders(
      <SettingsDrawer open onClose={vi.fn()} />,
    );

    await selectOption(screen, "Voice", "Alex");
    await selectOption(screen, "Language", "עברית");
    await selectOption(screen, "קול", "Ayelet");
    await selectOption(screen, "שפה", "English");

    await expect
      .element(screen.getByRole("combobox", { name: "Voice" }))
      .toHaveTextContent("Alex");

    await selectOption(screen, "Language", "עברית");

    await expect
      .element(screen.getByRole("combobox", { name: "קול" }))
      .toHaveTextContent("Ayelet");
  });

  test("calls onClose when the close button is clicked", async () => {
    const onClose = vi.fn();
    const screen = await renderWithProviders(
      <SettingsDrawer open onClose={onClose} />,
    );

    await screen.getByRole("button", { name: "Close settings" }).click();

    expect(onClose).toHaveBeenCalledOnce();
  });

  test("keeps the close button in view after scrolling to the end", async () => {
    const screen = await renderWithProviders(
      <SettingsDrawer open onClose={vi.fn()} />,
    );

    screen
      .getByRole("link", { name: /Source code/i })
      .element()
      .scrollIntoView();

    await expect
      .element(screen.getByRole("button", { name: "Close settings" }))
      .toBeInViewport();
  });
});

async function selectOption(
  screen: RenderResult,
  comboboxName: string,
  optionName: string,
): Promise<void> {
  await screen.getByRole("combobox", { name: comboboxName }).click();
  await screen.getByRole("option", { name: optionName }).click();
}
