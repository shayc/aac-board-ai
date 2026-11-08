import { AppProviders } from "@shared/providers/app-providers";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { AppDrawer } from "./app-drawer";

function drawerElement(open: boolean) {
  return (
    <AppProviders>
      <AppDrawer
        title="Panel"
        closeLabel="Close panel"
        open={open}
        anchor="left"
        onClose={vi.fn()}
      >
        <div style={{ height: 4000 }}>Tall content</div>
      </AppDrawer>
    </AppProviders>
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
    const screen = await render(drawerElement(true));
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

    await screen.rerender(drawerElement(false));
    await expect
      .element(screen.getByText("Tall content"))
      .not.toBeInTheDocument();

    await screen.rerender(drawerElement(true));
    await expect.element(screen.getByText("Tall content")).toBeInTheDocument();

    expect(headerBorderColor()).toBe(unscrolledColor);
  });
});
