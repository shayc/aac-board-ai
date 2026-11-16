import { expectNoA11yViolations } from "@shared/testing/axe";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { AppDrawer } from "./app-drawer";

function renderDrawer(
  open: boolean,
  content: ReactNode = <div style={{ height: 4000 }}>Tall content</div>,
  onClose = vi.fn(),
) {
  return (
    <AppDrawer
      title="Panel"
      closeLabel="Close panel"
      errorTitle="Couldn't load panel"
      open={open}
      onClose={onClose}
      anchor="left"
    >
      {content}
    </AppDrawer>
  );
}

function BrokenContent(): ReactNode {
  throw new Error("Panel content failed to render");
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

  test("has no accessibility violations when its content fails to render", async () => {
    const screen = await renderWithProviders(
      renderDrawer(true, <BrokenContent />),
    );
    await expect.element(screen.getByText("Couldn't load panel")).toBeVisible();

    await expectNoA11yViolations(document.body);
  });

  test("keeps the drawer closable when its content fails to render", async () => {
    const onClose = vi.fn();
    const screen = await renderWithProviders(
      renderDrawer(true, <BrokenContent />, onClose),
    );

    await expect.element(screen.getByText("Couldn't load panel")).toBeVisible();

    await screen.getByRole("button", { name: "Close panel" }).click();

    expect(onClose).toHaveBeenCalledOnce();
  });

  test("retries content that failed to render when the drawer reopens", async () => {
    const screen = await renderWithProviders(
      renderDrawer(true, <BrokenContent />),
    );
    await expect.element(screen.getByText("Couldn't load panel")).toBeVisible();

    await screen.rerender(renderDrawer(false));
    await expect
      .element(screen.getByText("Couldn't load panel"))
      .not.toBeInTheDocument();
    await screen.rerender(renderDrawer(true));

    await expect.element(screen.getByText("Tall content")).toBeVisible();
  });
});
