import { resetBoardsDB, seedBoardSets } from "../testing";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import { listBoardSetRecords } from "../storage/board-set-storage";
import { closeBoardsDB, getBoardsDB } from "../storage/boards-db";
import { BoardSetLibrary } from "./board-set-library";
import { refreshBoardSets } from "./board-sets-store";

function renderBoardSetLibrary() {
  return render(
    <MemoryRouter>
      <AppProviders>
        <BoardSetLibrary onNavigate={vi.fn()} />
      </AppProviders>
    </MemoryRouter>,
  );
}

function listedBoardSetNames(screen: RenderResult) {
  return screen
    .getByRole("navigation", { name: "Board sets" })
    .getByRole("listitem")
    .elements()
    .map((row) => row.textContent)
    .filter((name) => name !== "Board sets");
}

describe("BoardSetLibrary", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  afterEach(async () => {
    await closeBoardsDB();
  });

  test("offers the import action and catalog downloads when no sets are stored", async () => {
    const screen = await renderBoardSetLibrary();

    await expect
      .element(screen.getByRole("button", { name: "Import board files" }))
      .toBeInTheDocument();
    await expect
      .element(
        screen
          .getByRole("navigation", { name: "Board sets" })
          .getByRole("button", { name: "Download First Words" }),
      )
      .toBeInTheDocument();
  });

  test("hides catalog downloads for board sets that are already stored", async () => {
    await seedBoardSets([
      { id: "first-words", rootBoardId: "root", name: "First Words" },
    ]);

    const screen = await renderBoardSetLibrary();

    await expect
      .element(screen.getByRole("link", { name: "First Words" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Download First Words" }))
      .not.toBeInTheDocument();
  });

  test("downloads a catalog board set and focuses its new library entry", async () => {
    const screen = await renderBoardSetLibrary();

    await screen.getByRole("button", { name: "Download First Words" }).click();

    const link = screen.getByRole("link", { name: "First Words" });
    await expect.element(link).toHaveFocus();
    await expect
      .element(screen.getByText('Downloaded board set "First Words"'))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Download First Words" }))
      .not.toBeInTheDocument();
  });

  test("lists stored and downloadable board sets together in name order", async () => {
    await seedBoardSets([
      { id: "zoo", rootBoardId: "root", name: "Zoo" },
      { id: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const screen = await renderBoardSetLibrary();

    await expect
      .element(screen.getByRole("link", { name: "Zoo" }))
      .toBeInTheDocument();
    expect(listedBoardSetNames(screen)).toEqual([
      "Animals",
      "First Words",
      "Quick Core 24",
      "Quick Core 60",
      "Zoo",
    ]);
  });

  test("keeps a downloaded board set in its place in the list", async () => {
    await seedBoardSets([
      { id: "animals", rootBoardId: "root", name: "Animals" },
      { id: "zoo", rootBoardId: "root", name: "Zoo" },
    ]);

    const screen = await renderBoardSetLibrary();
    await expect
      .element(screen.getByRole("link", { name: "Zoo" }))
      .toBeInTheDocument();
    const namesBeforeDownload = listedBoardSetNames(screen);

    await screen.getByRole("button", { name: "Download First Words" }).click();

    await expect
      .element(screen.getByRole("link", { name: "First Words" }))
      .toHaveFocus();
    expect(listedBoardSetNames(screen)).toEqual(namesBeforeDownload);
  });

  test("keeps the download action when a download fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 500 }),
    );

    const screen = await renderBoardSetLibrary();

    await screen.getByRole("button", { name: "Download First Words" }).click();

    await expect
      .element(screen.getByText(`Couldn't download board set "First Words"`))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Download First Words" }))
      .toBeInTheDocument();
    expect(await listBoardSetRecords()).toEqual([]);
  });

  test("marks the download button unavailable while its download runs", async () => {
    const { promise: response, resolve } = Promise.withResolvers<Response>();
    vi.spyOn(globalThis, "fetch").mockReturnValue(response);

    const screen = await renderBoardSetLibrary();
    const button = screen.getByRole("button", { name: "Download First Words" });

    await expect.element(button).toHaveAttribute("aria-disabled", "false");
    await button.click();
    await expect.element(button).toHaveAttribute("aria-disabled", "true");

    resolve(new Response(null, { status: 500 }));

    await expect.element(button).toHaveAttribute("aria-disabled", "false");
    await expect.element(button).toHaveFocus();
  });

  test("stores one board set when a download is requested again after reopening the library", async () => {
    const starterBoardFile = await fetch("/first-words.obz").then((response) =>
      response.blob(),
    );
    const { promise: response, resolve } = Promise.withResolvers<Response>();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockReturnValue(response);

    const closedScreen = await renderBoardSetLibrary();
    await closedScreen
      .getByRole("button", { name: "Download First Words" })
      .click();
    await closedScreen.unmount();

    const screen = await renderBoardSetLibrary();
    const button = screen.getByRole("button", { name: "Download First Words" });
    await expect.element(button).toHaveAttribute("aria-disabled", "true");
    await button.click({ force: true });
    resolve(new Response(starterBoardFile));

    await expect
      .element(screen.getByRole("link", { name: "First Words" }))
      .toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(await listBoardSetRecords()).toHaveLength(1);
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
      .element(screen.getByRole("button", { name: "Download First Words" }))
      .not.toBeInTheDocument();
  });

  test("deletes a set after confirmation", async () => {
    await seedBoardSets([
      { id: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const screen = await renderBoardSetLibrary();

    await screen
      .getByRole("button", { name: "More options for Animals" })
      .click();
    await screen.getByRole("menuitem", { name: "Delete" }).click();

    await expect
      .element(screen.getByText("Delete board set?"))
      .toBeInTheDocument();
    await screen.getByRole("button", { name: "Delete" }).click();

    await expect
      .element(screen.getByRole("link", { name: "Animals" }))
      .not.toBeInTheDocument();
  });

  test("keeps the set when the delete dialog is cancelled", async () => {
    await seedBoardSets([
      { id: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const screen = await renderBoardSetLibrary();

    await screen
      .getByRole("button", { name: "More options for Animals" })
      .click();
    await screen.getByRole("menuitem", { name: "Delete" }).click();
    await screen.getByRole("button", { name: "Cancel" }).click();

    await expect.element(screen.getByText("Animals")).toBeInTheDocument();
    await expect
      .element(screen.getByText("Delete board set?"))
      .not.toBeInTheDocument();
  });

  test("lists stored and downloadable board sets with no accessibility violations", async () => {
    await seedBoardSets([
      { id: "animals", rootBoardId: "root", name: "Animals" },
      { id: "core-words", rootBoardId: "root", name: "Core Words" },
    ]);

    const screen = await renderBoardSetLibrary();

    await expect.element(screen.getByText("Board sets")).toBeInTheDocument();
    await expect.element(screen.getByText("Animals")).toBeInTheDocument();
    await expect.element(screen.getByText("Core Words")).toBeInTheDocument();
    await expect.element(screen.getByText("First Words")).toBeInTheDocument();

    await expectNoA11yViolations(document.body);
  });
});
