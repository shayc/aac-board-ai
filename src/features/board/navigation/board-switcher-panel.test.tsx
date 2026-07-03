import { LanguageProvider } from "@shared/language/language-provider";
import {
  DEFAULT_LANGUAGE,
  setStoredLanguage,
} from "@shared/language/language-store";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { replaceBoardSet } from "../storage/boards-db";
import { clearBoardsDB, makeOBFBoard } from "../storage/test-utils";
import { BoardSwitcherPanel } from "./board-switcher-panel";

function renderPanel(props: {
  setId: string;
  selectedBoardId: string | undefined;
  onSelect: (boardId: string) => void;
}) {
  return render(
    <LanguageProvider>
      <BoardSwitcherPanel {...props} />
    </LanguageProvider>,
  );
}

beforeEach(async () => {
  setStoredLanguage(DEFAULT_LANGUAGE);
  await clearBoardsDB();
  await replaceBoardSet({
    boardSet: { setId: "set-1", name: "Set", rootBoardId: "root" },
    boards: [
      {
        boardId: "root",
        name: "Home",
        obf: makeOBFBoard({ id: "root", name: "Home" }),
      },
      {
        boardId: "animals",
        name: "Animals",
        obf: makeOBFBoard({ id: "animals", name: "Animals" }),
      },
      {
        boardId: "food",
        name: "Food",
        obf: makeOBFBoard({ id: "food", name: "Food" }),
      },
    ],
    assets: [],
  });
});

describe("BoardSwitcherPanel", () => {
  test("lists the set's boards alphabetically", async () => {
    const screen = await renderPanel({
      setId: "set-1",
      selectedBoardId: "root",
      onSelect: vi.fn(),
    });

    const items = screen.getByRole("button");
    await expect.element(items.first()).toHaveTextContent("Animals");
    await expect.element(items.nth(1)).toHaveTextContent("Food");
    await expect.element(items.nth(2)).toHaveTextContent("Home");
  });

  test("filters by the search query", async () => {
    const screen = await renderPanel({
      setId: "set-1",
      selectedBoardId: "root",
      onSelect: vi.fn(),
    });

    await screen.getByRole("searchbox").fill("ani");

    await expect.element(screen.getByText("Animals")).toBeInTheDocument();
    await expect.element(screen.getByText("Food")).not.toBeInTheDocument();
  });

  test("shows a no-results message when nothing matches", async () => {
    const screen = await renderPanel({
      setId: "set-1",
      selectedBoardId: "root",
      onSelect: vi.fn(),
    });

    await screen.getByRole("searchbox").fill("zzz");

    await expect
      .element(screen.getByText("No boards found"))
      .toBeInTheDocument();
  });

  test("calls onSelect with the board id when a row is clicked", async () => {
    const onSelect = vi.fn();
    const screen = await renderPanel({
      setId: "set-1",
      selectedBoardId: "root",
      onSelect,
    });

    await screen.getByRole("button", { name: "Food" }).click();

    expect(onSelect).toHaveBeenCalledExactlyOnceWith("food");
  });

  test("shows the cached translated name for the active language, falling back to the raw name otherwise", async () => {
    await replaceBoardSet({
      boardSet: { setId: "set-2", name: "Set", rootBoardId: "root" },
      boards: [
        {
          boardId: "root",
          name: "Home",
          obf: makeOBFBoard({
            id: "root",
            name: "Home",
            strings: { es: { Home: "Inicio" } },
          }),
        },
        {
          boardId: "animals",
          name: "Animals",
          obf: makeOBFBoard({ id: "animals", name: "Animals" }),
        },
      ],
      assets: [],
    });

    setStoredLanguage("es");

    const screen = await renderPanel({
      setId: "set-2",
      selectedBoardId: "root",
      onSelect: vi.fn(),
    });

    await expect.element(screen.getByText("Inicio")).toBeInTheDocument();
    await expect.element(screen.getByText("Animals")).toBeInTheDocument();

    await screen.getByRole("searchbox").fill("Inicio");
    await expect.element(screen.getByText("Inicio")).toBeInTheDocument();
    await expect.element(screen.getByText("Animals")).not.toBeInTheDocument();
  });
});
