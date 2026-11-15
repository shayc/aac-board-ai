import { renderWithProviders } from "@shared/testing/render-with-providers";
import { tabToNextControl } from "@shared/testing/tab-to-next-control";
import { textLeft } from "@shared/testing/text-position";
import { afterEach, describe, expect, test } from "vitest";
import { ShortcutTooltip } from "./shortcut-tooltip";

describe("ShortcutTooltip", () => {
  afterEach(() => {
    document.documentElement.dir = "ltr";
  });

  test("keeps key symbols in order in a right-to-left interface", async () => {
    const screen = await renderWithProviders(
      <ShortcutTooltip action="ניקוי המסר" keys="⌘⌫">
        <button type="button">Backspace</button>
      </ShortcutTooltip>,
    );
    // The providers set the page direction from the UI locale on mount.
    document.documentElement.dir = "rtl";

    await tabToNextControl();

    const tooltip = screen.getByRole("tooltip");
    await expect.element(tooltip).toBeInTheDocument();
    const text = tooltip.element();

    expect(textLeft(text, "⌘")).toBeLessThan(textLeft(text, "⌫"));
  });
});
