import { AppProviders } from "@app/AppProviders";
import { invalidateBoardSets } from "@features/board/storage/board-sets-store";
import { putBoards, upsertBoardSet } from "@features/board/storage/boards-db";
import {
  openCleanBoardsDB,
  resetBoardsDB,
} from "@features/board/storage/test-helpers";
import type { OBFBoard } from "open-board-format";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import BoardPage from "./BoardPage";

function Wrapper({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}

function renderBoardPage(setId: string, boardId: string) {
  return render(
    <MemoryRouter initialEntries={[`/sets/${setId}/boards/${boardId}`]}>
      <Routes>
        <Route path="/sets/:setId/boards/:boardId" element={<BoardPage />} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

async function seedBoard(setId: string, boardId: string) {
  const db = await openCleanBoardsDB();
  try {
    await upsertBoardSet(db, { setId, name: setId, rootBoardId: boardId });
    const json: OBFBoard = {
      format: "open-board-0.1",
      id: boardId,
      locale: "en",
      buttons: [{ id: "btn-1", label: "Hello" }],
      grid: { rows: 1, columns: 1, order: [["btn-1"]] },
    };
    await putBoards(db, setId, [{ boardId, name: boardId, json }]);
  } finally {
    db.close();
  }
  await invalidateBoardSets();
}

describe("BoardPage", () => {
  beforeEach(async () => {
    await resetBoardsDB();
    await invalidateBoardSets();
  });

  afterEach(async () => {
    localStorage.clear();
    await resetBoardsDB();
    await invalidateBoardSets();
  });

  test("renders the error fallback when the board is not in IndexedDB", async () => {
    const screen = await renderBoardPage("missing-set", "missing-board");

    await expect
      .element(screen.getByText("Failed to load board"))
      .toBeVisible();
    await expect.element(screen.getByText(/Board not found/)).toBeVisible();
  });

  test("renders the board when present", async () => {
    await seedBoard("test-set", "board-1");

    const screen = await renderBoardPage("test-set", "board-1");

    await expect
      .element(screen.getByRole("button", { name: "Hello" }))
      .toBeVisible();
  });
});
