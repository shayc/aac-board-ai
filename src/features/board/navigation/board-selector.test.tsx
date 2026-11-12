import { listBoardSummaries, type BoardSummary } from "@features/library";
import {
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "@features/library/testing";
import {
  DEFAULT_LANGUAGE,
  setStoredLanguage,
} from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { useState } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { BoardSelector } from "./board-selector";

interface SelectorHarnessProps {
  boards: readonly BoardSummary[];
  initialBoardId: string;
  onSelect: (boardId: string) => void;
}

function SelectorHarness({
  boards,
  initialBoardId,
  onSelect,
}: SelectorHarnessProps) {
  const [boardId, setBoardId] = useState(initialBoardId);

  return (
    <BoardSelector
      boards={boards}
      boardId={boardId}
      onSelect={(selectedBoardId) => {
        setBoardId(selectedBoardId);
        onSelect(selectedBoardId);
      }}
    />
  );
}

async function renderSelector(boardSetId: string, boardId: string) {
  const boards = await listBoardSummaries(boardSetId);
  const onSelect = vi.fn<(boardId: string) => void>();

  const screen = await render(
    <AppProviders>
      <SelectorHarness
        boards={boards}
        initialBoardId={boardId}
        onSelect={onSelect}
      />
    </AppProviders>,
  );

  return { onSelect, screen };
}

beforeEach(async () => {
  setStoredLanguage(DEFAULT_LANGUAGE);
  await resetBoardsDB();
  await seedBoardSets([
    {
      id: "set-1",
      name: "Set",
      rootBoardId: "root",
      boards: [
        makeOBFBoard({ id: "root", name: "Home" }),
        makeOBFBoard({ id: "animals", name: "Animals" }),
        makeOBFBoard({ id: "food", name: "Food" }),
      ],
      assets: [],
    },
  ]);
});

describe("BoardSelector", () => {
  test("opens the popup with boards listed alphabetically and the current board selected", async () => {
    const { screen } = await renderSelector("set-1", "root");

    await screen.getByRole("combobox").click();

    const items = screen.getByRole("option");
    await expect.element(items.first()).toHaveTextContent("Animals");
    await expect.element(items.nth(1)).toHaveTextContent("Food");
    await expect.element(items.nth(2)).toHaveTextContent("Home");
    await expect
      .element(screen.getByRole("option", { name: "Home" }))
      .toHaveAttribute("aria-selected", "true");

    // Axe's region rule flags the popup portaled outside the app's landmarks.
    await expectNoA11yViolations(document.body, {
      rules: { region: { enabled: false } },
    });
  });

  test("selects a board and closes the popup when a board is clicked", async () => {
    const { onSelect, screen } = await renderSelector("set-1", "root");

    await screen.getByRole("combobox").click();
    await screen.getByRole("option", { name: "Animals" }).click();

    expect(onSelect).toHaveBeenCalledExactlyOnceWith("animals");
    await expect
      .element(screen.getByRole("option", { name: "Animals" }))
      .not.toBeInTheDocument();
    await expect.element(screen.getByRole("combobox")).toHaveValue("Animals");
  });

  test("selects with arrow keys and Enter", async () => {
    const { onSelect, screen } = await renderSelector("set-1", "root");

    await screen.getByRole("combobox").click();
    await userEvent.keyboard("{ArrowDown}{Enter}");

    expect(onSelect).toHaveBeenCalledExactlyOnceWith("animals");
  });

  test("filters while typing and selects the first match with Enter", async () => {
    const { onSelect, screen } = await renderSelector("set-1", "root");

    await screen.getByRole("combobox").fill("ani");

    await expect
      .element(screen.getByRole("option", { name: "Animals" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("option", { name: "Food" }))
      .not.toBeInTheDocument();

    await userEvent.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledExactlyOnceWith("animals");
  });

  test("updates popup labels and empty results when the locale changes", async () => {
    const { screen } = await renderSelector("set-1", "root");

    await screen.getByRole("button", { name: "Open board list" }).click();
    await screen.getByRole("combobox", { name: "Board" }).fill("no-match");

    await expect
      .element(screen.getByRole("button", { name: "Close board list" }))
      .toBeVisible();
    await expect.element(screen.getByText("No matching boards")).toBeVisible();

    setStoredLanguage("he");

    await expect
      .element(screen.getByText("לא נמצאו לוחות תואמים"))
      .toBeVisible();
    await screen.getByRole("button", { name: "סגירת רשימת הלוחות" }).click();

    await expect
      .element(screen.getByRole("button", { name: "פתיחת רשימת הלוחות" }))
      .toBeVisible();
  });

  test("closes the popup on Escape and restores the current board name on blur", async () => {
    const { onSelect, screen } = await renderSelector("set-1", "root");

    await screen.getByRole("combobox").fill("ani");
    await userEvent.keyboard("{Escape}");

    await expect
      .element(screen.getByRole("option", { name: "Animals" }))
      .not.toBeInTheDocument();

    await userEvent.tab();

    await expect.element(screen.getByRole("combobox")).toHaveValue("Home");
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("shows the cached translated name for the active language, falling back to the raw name otherwise", async () => {
    await seedBoardSets([
      {
        id: "set-2",
        name: "Set",
        rootBoardId: "root",
        boards: [
          makeOBFBoard({
            id: "root",
            name: "Home",
            strings: { es: { Home: "Inicio" } },
          }),
          makeOBFBoard({ id: "animals", name: "Animals" }),
        ],
        assets: [],
      },
    ]);

    setStoredLanguage("es");

    const { screen } = await renderSelector("set-2", "root");

    await expect.element(screen.getByRole("combobox")).toHaveValue("Inicio");

    await screen.getByRole("combobox").click();
    await expect
      .element(screen.getByRole("option", { name: "Animals" }))
      .toBeInTheDocument();
  });

  test("shows the name of a board named after an inherited object property that its translations leave out", async () => {
    await seedBoardSets([
      {
        id: "set-2",
        name: "Set",
        rootBoardId: "root",
        boards: [
          makeOBFBoard({
            id: "root",
            name: "constructor",
            strings: { es: { Home: "Inicio" } },
          }),
        ],
        assets: [],
      },
    ]);

    setStoredLanguage("es");

    const { screen } = await renderSelector("set-2", "root");

    await expect
      .element(screen.getByRole("combobox"))
      .toHaveValue("constructor");
  });
});
