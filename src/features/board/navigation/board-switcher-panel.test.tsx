import type { OBFBoard } from "@shayc/open-board-format";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { replaceBoardSet } from "../storage/boards-db";
import { clearBoardsDB } from "../storage/test-utils";
import { BoardSwitcherPanel } from "./board-switcher-panel";

function makeOBFBoard(id: string): OBFBoard {
  return {
    format: "open-board-0.1",
    id,
    locale: "en",
    name: id,
    buttons: [],
    grid: { rows: 1, columns: 1, order: [[null]] },
    images: [],
    sounds: [],
  };
}

beforeEach(async () => {
  await clearBoardsDB();
  await replaceBoardSet({
    boardSet: { setId: "set-1", name: "Set", rootBoardId: "root" },
    boards: [
      { boardId: "root", name: "Home", obf: makeOBFBoard("root") },
      { boardId: "animals", name: "Animals", obf: makeOBFBoard("animals") },
      { boardId: "food", name: "Food", obf: makeOBFBoard("food") },
    ],
    assets: [],
  });
});

describe("BoardSwitcherPanel", () => {
  test("lists the set's boards alphabetically", async () => {
    const screen = await render(
      <BoardSwitcherPanel
        setId="set-1"
        selectedBoardId="root"
        onSelect={vi.fn()}
      />,
    );

    const items = screen.getByRole("button");
    await expect.element(items.first()).toHaveTextContent("Animals");
    await expect.element(items.nth(1)).toHaveTextContent("Food");
    await expect.element(items.nth(2)).toHaveTextContent("Home");
  });

  test("filters by the search query", async () => {
    const screen = await render(
      <BoardSwitcherPanel
        setId="set-1"
        selectedBoardId="root"
        onSelect={vi.fn()}
      />,
    );

    await screen.getByRole("searchbox").fill("ani");

    await expect.element(screen.getByText("Animals")).toBeInTheDocument();
    await expect.element(screen.getByText("Food")).not.toBeInTheDocument();
  });

  test("shows a no-results message when nothing matches", async () => {
    const screen = await render(
      <BoardSwitcherPanel
        setId="set-1"
        selectedBoardId="root"
        onSelect={vi.fn()}
      />,
    );

    await screen.getByRole("searchbox").fill("zzz");

    await expect
      .element(screen.getByText("No boards found"))
      .toBeInTheDocument();
  });

  test("calls onSelect with the board id when a row is clicked", async () => {
    const onSelect = vi.fn();
    const screen = await render(
      <BoardSwitcherPanel
        setId="set-1"
        selectedBoardId="root"
        onSelect={onSelect}
      />,
    );

    await screen.getByRole("button", { name: "Food" }).click();

    expect(onSelect).toHaveBeenCalledExactlyOnceWith("food");
  });
});
