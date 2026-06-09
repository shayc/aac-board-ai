import { resetBoardsDB, seedBoardSets } from "@features/board/testing";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Component as LibraryPage } from "./library-page";

function renderLibraryPage() {
  return render(
    <MemoryRouter>
      <AppProviders>
        <LibraryPage />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("LibraryPage", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("shows the empty state with an import action when no sets exist", async () => {
    const screen = await renderLibraryPage();

    await expect
      .element(screen.getByText("Library is empty"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Import boards" }))
      .toBeInTheDocument();
  });

  test("lists the stored board sets", async () => {
    await seedBoardSets([
      { setId: "animals", rootBoardId: "root", name: "Animals" },
      { setId: "core-words", rootBoardId: "root", name: "Core Words" },
    ]);

    const screen = await renderLibraryPage();

    await expect.element(screen.getByText("Animals")).toBeInTheDocument();
    await expect.element(screen.getByText("Core Words")).toBeInTheDocument();
  });

  test("deletes a set after confirmation and announces it", async () => {
    await seedBoardSets([
      { setId: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const screen = await renderLibraryPage();

    await screen
      .getByRole("button", { name: "More options for Animals" })
      .click();
    await screen.getByRole("menuitem", { name: "Delete" }).click();

    await expect
      .element(screen.getByText('Delete "Animals"?'))
      .toBeInTheDocument();
    await screen.getByRole("button", { name: "Delete" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent('"Animals" deleted');
    await expect
      .element(screen.getByText("Library is empty"))
      .toBeInTheDocument();
  });

  test("keeps the set when the delete dialog is cancelled", async () => {
    await seedBoardSets([
      { setId: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const screen = await renderLibraryPage();

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

  test("has no a11y violations with a populated list", async () => {
    await seedBoardSets([
      { setId: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const screen = await renderLibraryPage();
    await expect.element(screen.getByText("Animals")).toBeInTheDocument();

    await expectNoA11yViolations(document.body);
  });
});
