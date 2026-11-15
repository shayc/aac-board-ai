import { renderWithProviders } from "@shared/testing/render-with-providers";
import { describe, expect, test, vi } from "vitest";
import { AppDrawer } from "./app-drawer";

function renderDrawer(open: boolean) {
  return (
    <AppDrawer
      title="Panel"
      closeLabel="Close panel"
      open={open}
      onClose={vi.fn()}
      anchor="left"
    >
      <div style={{ height: 4000 }}>Tall content</div>
    </AppDrawer>
  );
}

function headerBorderColor(): string {
  const header = document.querySelector("header");
  if (!header) {
    throw new Error("Drawer header is not rendered");
  }

  return getComputedStyle(header).borderBottomColor;
}

describe("AppDrawer", () => {
  test("clears the scrolled divider when the drawer reopens", async () => {
    const screen = await renderWithProviders(renderDrawer(true));
    const content = screen.getByText("Tall content").element().parentElement;
    if (!content) {
      throw new Error("Drawer content is not rendered");
    }

    const unscrolledColor = headerBorderColor();
    content.scrollTop = 200;
    content.dispatchEvent(new Event("scroll"));

    await vi.waitFor(() => {
      expect(headerBorderColor()).not.toBe(unscrolledColor);
    });

    await screen.rerender(renderDrawer(false));
    await expect
      .element(screen.getByText("Tall content"))
      .not.toBeInTheDocument();

    await screen.rerender(renderDrawer(true));
    await expect.element(screen.getByText("Tall content")).toBeInTheDocument();

    expect(headerBorderColor()).toBe(unscrolledColor);
  });
});
