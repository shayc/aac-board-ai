import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import {
  stubProofreader,
  stubRewriter,
  stubTranslator,
} from "@shared/testing/stub-built-in-ai";
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

    const drawerItemsInOrder = [
      screen.getByRole("heading", { name: "Appearance" }),
      screen.getByRole("radiogroup", { name: "Theme" }),
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
    for (const item of drawerItemsInOrder) {
      await expect.element(item).toBeInTheDocument();
    }
    for (const [index, next] of drawerItemsInOrder.slice(1).entries()) {
      expect(
        drawerItemsInOrder[index]
          .element()
          .compareDocumentPosition(next.element()),
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }

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

  test("names each section group after its heading", async () => {
    const screen = await render(
      <AppProviders>
        <SettingsDrawer open onClose={vi.fn()} />
      </AppProviders>,
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

  test("styles select labels like the other settings labels", async () => {
    const screen = await render(
      <AppProviders>
        <SettingsDrawer open onClose={vi.fn()} />
      </AppProviders>,
    );

    const labels = ["Theme", "Language", "Voice", "Speed"];
    const styles = labels.map((label) => {
      const { fontSize, fontWeight, color } = getComputedStyle(
        screen.getByText(label, { exact: true }).element(),
      );
      return { fontSize, fontWeight, color };
    });

    for (const style of styles) {
      expect(style).toEqual(styles[0]);
    }
  });

  test("separates the header from the content once it scrolls", async () => {
    const screen = await render(
      <AppProviders>
        <SettingsDrawer open onClose={vi.fn()} />
      </AppProviders>,
    );
    const header = screen
      .getByRole("heading", { name: "Settings" })
      .element()
      .closest("header");
    if (!header) {
      throw new Error("Settings heading must sit in a header");
    }
    const transparent = "rgba(0, 0, 0, 0)";

    await expect.element(header).toHaveStyle({
      borderBottomColor: transparent,
    });

    screen
      .getByRole("link", { name: /Source code/i })
      .element()
      .scrollIntoView();

    await expect
      .poll(() => getComputedStyle(header).borderBottomColor)
      .not.toBe(transparent);
  });

  test("formats setting values for the selected language", async () => {
    const screen = await render(
      <AppProviders>
        <SettingsDrawer open onClose={vi.fn()} />
      </AppProviders>,
    );

    await screen.getByRole("combobox", { name: "Language" }).click();
    await screen.getByRole("option", { name: "Deutsch" }).click();

    await expect
      .element(screen.getByRole("slider", { name: "Geschwindigkeit" }))
      .toHaveAttribute("aria-valuetext", "1,0×");
    await expect
      .element(screen.getByRole("slider", { name: "Lautstärke" }))
      .toHaveAttribute("aria-valuetext", expect.stringMatching(/^100\s%$/));
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

  test("keeps the close button in view after scrolling to the end", async () => {
    const screen = await render(
      <AppProviders>
        <SettingsDrawer open onClose={vi.fn()} />
      </AppProviders>,
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
