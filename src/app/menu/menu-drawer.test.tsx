import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MenuDrawer } from "./menu-drawer";

function renderMenuDrawer(onClose = vi.fn()) {
  return render(
    <MemoryRouter>
      <AppProviders>
        <MenuDrawer open onClose={onClose} />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("MenuDrawer", () => {
  test("offers the app navigation when open", async () => {
    const screen = await renderMenuDrawer();

    await expect
      .element(screen.getByRole("link", { name: "Home" }))
      .toHaveAttribute("href", "/");
    await expect
      .element(screen.getByRole("link", { name: "Library" }))
      .toHaveAttribute("href", "/library");
    await expect
      .element(screen.getByRole("link", { name: "About" }))
      .toHaveAttribute("href", "/about");

    await expectNoA11yViolations(document.body);
  });

  test("navigating closes the drawer", async () => {
    const onClose = vi.fn();
    const screen = await renderMenuDrawer(onClose);

    await screen.getByRole("link", { name: "Library" }).click();

    expect(onClose).toHaveBeenCalledOnce();
  });
});
