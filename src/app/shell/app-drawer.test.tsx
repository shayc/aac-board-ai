import { AppProviders } from "@shared/providers/app-providers";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { AppDrawer } from "./app-drawer";

function renderDrawer(open: boolean) {
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

function ShowErrorButton() {
  const { showSnackbar } = useSnackbar();

  return (
    <button
      onClick={() => showSnackbar({ message: "failed", severity: "error" })}
    >
      show-error
    </button>
  );
}

function renderDrawerWithSnackbar(open: boolean) {
  return (
    <AppProviders>
      <AppDrawer
        title="Panel"
        closeLabel="Close panel"
        open={open}
        anchor="left"
        onClose={vi.fn()}
      >
        <ShowErrorButton />
      </AppDrawer>
    </AppProviders>
  );
}

describe("AppDrawer", () => {
  test("hosts snackbars so they are announced and closable by keyboard while it is open", async () => {
    const screen = await render(renderDrawerWithSnackbar(true));
    const drawer = screen.getByRole("dialog", { name: "Panel" });

    await drawer.getByRole("button", { name: "show-error" }).click();

    // Role queries skip anything hidden from assistive technology, so finding
    // the alert inside the drawer proves it is exposed.
    const alert = drawer.getByRole("alert");
    await expect.element(alert).toHaveTextContent("failed");

    const alertBounds = alert.element().getBoundingClientRect();
    const drawerBounds = drawer.element().getBoundingClientRect();
    expect(alertBounds.left).toBeGreaterThanOrEqual(drawerBounds.left);
    expect(alertBounds.right).toBeLessThanOrEqual(drawerBounds.right);

    await userEvent.tab();
    await expect
      .element(drawer.getByRole("button", { name: "Close", exact: true }))
      .toHaveFocus();
    await userEvent.keyboard("{Enter}");

    await expect.element(alert).not.toBeInTheDocument();
    await expectNoA11yViolations(document.body);
  });

  test("hands a persistent snackbar back to the page when it closes", async () => {
    const screen = await render(renderDrawerWithSnackbar(true));

    await screen.getByRole("button", { name: "show-error" }).click();
    await expect.element(screen.getByRole("alert")).toBeVisible();

    await screen.rerender(renderDrawerWithSnackbar(false));

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("failed");
  });

  test("clears the scrolled divider when the drawer reopens", async () => {
    const screen = await render(renderDrawer(true));
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
