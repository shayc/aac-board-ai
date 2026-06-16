import { resetBoardsDB, seedBoardSets } from "@features/board/testing";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { LibraryDrawer } from "./library-drawer";

function renderLibraryDrawer(onClose = vi.fn()) {
  return render(
    <MemoryRouter>
      <AppProviders>
        <LibraryDrawer open onClose={onClose} />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("LibraryDrawer", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  afterEach(async () => {
    await page.viewport(1280, 720);
  });

  test("shows the empty state with an import action when no sets exist", async () => {
    const screen = await renderLibraryDrawer();

    await expect
      .element(screen.getByText("Library is empty"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Import boards" }))
      .toBeInTheDocument();
  });

  test("shows the board library when open, with no a11y violations", async () => {
    await seedBoardSets([
      { setId: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const screen = await renderLibraryDrawer();

    await expect.element(screen.getByText("Animals")).toBeInTheDocument();

    await expectNoA11yViolations(document.body);
  });

  test("keeps the docked drawer open when a board set is selected", async () => {
    await page.viewport(1280, 720);
    const onClose = vi.fn();
    await seedBoardSets([
      { setId: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const screen = await renderLibraryDrawer(onClose);

    await screen.getByRole("button", { name: "Animals", exact: true }).click();

    expect(onClose).not.toHaveBeenCalled();
  });

  test("closes the overlay drawer when a board set is selected", async () => {
    await page.viewport(390, 844);
    const onClose = vi.fn();
    await seedBoardSets([
      { setId: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const screen = await renderLibraryDrawer(onClose);

    await screen.getByRole("button", { name: "Animals", exact: true }).click();

    expect(onClose).toHaveBeenCalledOnce();
  });

  test("removes a set after the delete is confirmed", async () => {
    await seedBoardSets([
      { setId: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const screen = await renderLibraryDrawer();

    await screen
      .getByRole("button", { name: "More options for Animals" })
      .click();
    await screen.getByRole("menuitem", { name: "Delete" }).click();

    await expect
      .element(screen.getByText('Delete "Animals"?'))
      .toBeInTheDocument();
    await screen.getByRole("button", { name: "Delete" }).click();

    await expect
      .element(screen.getByText("Library is empty"))
      .toBeInTheDocument();
  });

  test("keeps the set when the delete dialog is cancelled", async () => {
    await seedBoardSets([
      { setId: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const screen = await renderLibraryDrawer();

    await screen
      .getByRole("button", { name: "More options for Animals" })
      .click();
    await screen.getByRole("menuitem", { name: "Delete" }).click();
    await screen.getByRole("button", { name: "Cancel" }).click();

    await expect.element(screen.getByText("Animals")).toBeInTheDocument();
    await expect
      .element(screen.getByText('Delete "Animals"?'))
      .not.toBeInTheDocument();
  });
});
