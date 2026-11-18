import { backdropClasses } from "@mui/material/Backdrop";
import { drawerClasses } from "@mui/material/Drawer";
import { setCommunicationLanguage } from "@shared/language/language-store";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { AppDrawer } from "./app-drawer";

const TRANSPARENT = "rgba(0, 0, 0, 0)";

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

function drawerBackdropColor(): string {
  const backdrop = document.querySelector(
    `.${drawerClasses.root} > .${backdropClasses.root}`,
  );
  if (!backdrop) {
    throw new Error("Drawer backdrop is not rendered");
  }

  return getComputedStyle(backdrop).backgroundColor;
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

  test("dims the page behind it unless its backdrop is invisible", async () => {
    const screen = await renderWithProviders(renderDrawer(true));
    await expect.element(screen.getByText("Tall content")).toBeInTheDocument();

    expect(drawerBackdropColor()).not.toBe(TRANSPARENT);

    await screen.rerender(
      <AppDrawer
        title="Panel"
        closeLabel="Close panel"
        errorTitle="Couldn't load panel"
        open
        onClose={vi.fn()}
        anchor="left"
        hasInvisibleBackdrop
      >
        Undimmed content
      </AppDrawer>,
    );

    await vi.waitFor(() => {
      expect(drawerBackdropColor()).toBe(TRANSPARENT);
    });
  });

  test.for([
    { language: "en", innerSide: "right", outerSide: "left" },
    { language: "he", innerSide: "left", outerSide: "right" },
  ] as const)(
    "marks the $innerSide edge of an undimmed start drawer in $language",
    async ({ language, innerSide, outerSide }) => {
      setCommunicationLanguage(language);
      const screen = await renderWithProviders(
        <AppDrawer
          title="Panel"
          closeLabel="Close panel"
          errorTitle="Couldn't load panel"
          open
          onClose={vi.fn()}
          anchor="left"
          hasInvisibleBackdrop
        >
          Undimmed content
        </AppDrawer>,
      );
      const panel = screen.getByRole("dialog", { name: "Panel" });
      await expect.element(panel).toBeVisible();

      const panelStyle = getComputedStyle(panel.element());

      expect(panelStyle.getPropertyValue(`border-${innerSide}-width`)).toBe(
        "1px",
      );
      expect(panelStyle.getPropertyValue(`border-${outerSide}-width`)).toBe(
        "0px",
      );
    },
  );

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
