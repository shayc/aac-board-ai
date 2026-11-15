import { assertDefined } from "@shared/testing/assert-defined";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
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

    await userEvent.tab();

    const tooltip = screen.getByRole("tooltip");
    await expect.element(tooltip).toBeInTheDocument();
    const text = findTextNode(tooltip.element());

    expect(glyphLeft(text, "⌘")).toBeLessThan(glyphLeft(text, "⌫"));
  });
});

function findTextNode(root: Element): Text {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const node = walker.nextNode();
  assertDefined(node);

  return node as Text;
}

function glyphLeft(text: Text, glyph: string): number {
  const index = text.data.indexOf(glyph);
  const range = document.createRange();
  range.setStart(text, index);
  range.setEnd(text, index + glyph.length);

  return range.getBoundingClientRect().left;
}
