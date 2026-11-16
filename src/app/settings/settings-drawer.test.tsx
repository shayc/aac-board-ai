import { expectNoA11yViolations } from "@shared/testing/axe";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import {
  stubProofreader,
  stubRewriter,
  stubTranslator,
} from "@shared/testing/stub-built-in-ai";
import { describe, expect, test, vi } from "vitest";
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
      screen.getByRole("switch", { name: "Highlight while speaking" }),
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
          .getByRole("switch", { name: "Highlight while speaking" }),
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

  test.for(["Language", "Voice"])(
    "keeps the %s choice when the press that opens its menu is slow",
    async (name) => {
      const screen = await renderWithProviders(
        <SettingsDrawer open onClose={vi.fn()} />,
      );
      const select = screen.getByRole("combobox", { name });
      await expect.element(select).toBeInTheDocument();
      const selectElement = select.element();
      const choice = selectElement.textContent;

      // Select picks the option under the pointer when a press outlasts 400ms.
      await select.click({ delay: 500 });

      await expect.element(screen.getByRole("listbox")).toBeVisible();
      expect(selectElement).toHaveTextContent(choice);
    },
  );

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
