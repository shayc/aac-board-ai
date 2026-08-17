import { resetBoardsDB, seedBoardSets } from "../testing";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { closeBoardsDB, getBoardsDB } from "../storage/boards-db";
import { BoardSetLibrary } from "./board-set-library";
import { refreshBoardSets } from "./board-sets-store";

function renderBoardSetLibrary(onSelect = vi.fn()) {
  return render(
    <MemoryRouter>
      <AppProviders>
        <BoardSetLibrary onSelect={onSelect} />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("BoardSetLibrary", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  afterEach(async () => {
    await closeBoardsDB();
  });

  test("shows the empty state with an import action when no sets exist", async () => {
    const screen = await renderBoardSetLibrary();

    await expect
      .element(screen.getByText("Library is empty"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Import board files" }))
      .toBeInTheDocument();
  });

  test("shows an error instead of the empty state when sets cannot be retrieved", async () => {
    const db = await getBoardsDB();
    db.close();
    await refreshBoardSets();

    const screen = await renderBoardSetLibrary();

    await expect
      .element(screen.getByText("Couldn't load library"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Library is empty"))
      .not.toBeInTheDocument();
  });

  test("invokes onSelect when a set is chosen", async () => {
    await seedBoardSets([
      { setId: "animals", rootBoardId: "root", name: "Animals" },
    ]);
    const onSelect = vi.fn();

    const screen = await renderBoardSetLibrary(onSelect);
    await screen.getByText("Animals").click();

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ setId: "animals" }),
    );
  });

  test("deletes a set after confirmation and announces it", async () => {
    await seedBoardSets([
      { setId: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const screen = await renderBoardSetLibrary();

    await screen
      .getByRole("button", { name: "More options for Animals" })
      .click();
    await screen.getByRole("menuitem", { name: "Delete" }).click();

    await expect
      .element(screen.getByText('Delete board set "Animals"?'))
      .toBeInTheDocument();
    await screen.getByRole("button", { name: "Delete" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent('Board set "Animals" deleted');
    await expect
      .element(screen.getByText("Library is empty"))
      .toBeInTheDocument();
  });

  test("keeps the set when the delete dialog is cancelled", async () => {
    await seedBoardSets([
      { setId: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const screen = await renderBoardSetLibrary();

    await screen
      .getByRole("button", { name: "More options for Animals" })
      .click();
    await screen.getByRole("menuitem", { name: "Delete" }).click();
    await screen.getByRole("button", { name: "Cancel" }).click();

    await expect.element(screen.getByText("Animals")).toBeInTheDocument();
    await expect
      .element(screen.getByText('Delete board set "Animals"?'))
      .not.toBeInTheDocument();
  });

  test("lists the stored board sets with no a11y violations", async () => {
    await seedBoardSets([
      { setId: "animals", rootBoardId: "root", name: "Animals" },
      { setId: "core-words", rootBoardId: "root", name: "Core Words" },
    ]);

    const screen = await renderBoardSetLibrary();

    await expect.element(screen.getByText("Board sets")).toBeInTheDocument();
    await expect.element(screen.getByText("Animals")).toBeInTheDocument();
    await expect.element(screen.getByText("Core Words")).toBeInTheDocument();

    await expectNoA11yViolations(document.body);
  });
});
