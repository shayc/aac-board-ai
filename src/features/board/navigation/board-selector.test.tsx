import { listBoardSummaries } from "@features/library";
import {
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "@features/library/testing";
import {
  DEFAULT_LANGUAGE,
  setCommunicationLanguage,
} from "@shared/language/language-store";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { beforeEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { BoardSelector } from "./board-selector";

async function renderSelector(boardSetId: string, boardId: string) {
  const boards = await listBoardSummaries(boardSetId);
  const router = createMemoryRouter(
    [
      {
        path: "/sets/:boardSetId/boards/:boardId",
        element: <BoardSelector boards={boards} />,
      },
    ],
    { initialEntries: [`/sets/${boardSetId}/boards/${boardId}`] },
  );

  const screen = await renderWithProviders(<RouterProvider router={router} />);

  return { router, screen };
}

beforeEach(async () => {
  setCommunicationLanguage(DEFAULT_LANGUAGE);
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
  test("has no accessibility violations with the popup open", async () => {
    const { screen } = await renderSelector("set-1", "root");

    await screen.getByRole("combobox").click();
    await expect
      .element(screen.getByRole("option", { name: "Home" }))
      .toBeVisible();

    // Axe's region rule flags the popup portaled outside the app's landmarks.
    await expectNoA11yViolations(document.body, {
      rules: { region: { enabled: false } },
    });
  });

  test("names the list of boards in the open popup", async () => {
    const { screen } = await renderSelector("set-1", "root");

    await screen.getByRole("combobox").click();

    await expect
      .element(screen.getByRole("listbox", { name: "Board" }))
      .toBeVisible();
  });

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
  });

  test("navigates, enables Back, and closes the popup when a board is clicked", async () => {
    const { router, screen } = await renderSelector("set-1", "root");

    await screen.getByRole("combobox").click();
    await screen.getByRole("option", { name: "Animals" }).click();

    expect(router.state.location.pathname).toBe("/sets/set-1/boards/animals");
    expect(router.state.location.state).toEqual({ canGoBack: true });
    await expect
      .element(screen.getByRole("option", { name: "Animals" }))
      .not.toBeInTheDocument();
    await expect.element(screen.getByRole("combobox")).toHaveValue("Animals");
  });

  test("navigates with arrow keys and Enter", async () => {
    const { router, screen } = await renderSelector("set-1", "root");

    await screen.getByRole("combobox").click();
    await userEvent.keyboard("{ArrowDown}{Enter}");

    expect(router.state.location.pathname).toBe("/sets/set-1/boards/animals");
  });

  test("filters while typing and selects the first match with Enter", async () => {
    const { router, screen } = await renderSelector("set-1", "root");

    await screen.getByRole("combobox").fill("ani");

    await expect
      .element(screen.getByRole("option", { name: "Animals" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("option", { name: "Food" }))
      .not.toBeInTheDocument();

    await userEvent.keyboard("{Enter}");

    expect(router.state.location.pathname).toBe("/sets/set-1/boards/animals");
  });

  test("updates popup labels and empty results when the locale changes", async () => {
    const { screen } = await renderSelector("set-1", "root");

    await screen.getByRole("button", { name: "Open board list" }).click();
    await screen.getByRole("combobox", { name: "Board" }).fill("no-match");

    await expect
      .element(screen.getByRole("button", { name: "Close board list" }))
      .toBeVisible();
    await expect.element(screen.getByText("No matching boards")).toBeVisible();

    setCommunicationLanguage("he");

    await expect
      .element(screen.getByText("לא נמצאו לוחות תואמים"))
      .toBeVisible();
    await screen.getByRole("button", { name: "סגירת רשימת הלוחות" }).click();

    await expect
      .element(screen.getByRole("button", { name: "פתיחת רשימת הלוחות" }))
      .toBeVisible();
  });

  test("closes the popup on Escape and restores the current board name on blur", async () => {
    const { router, screen } = await renderSelector("set-1", "root");

    await screen.getByRole("combobox").fill("ani");
    await userEvent.keyboard("{Escape}");

    await expect
      .element(screen.getByRole("option", { name: "Animals" }))
      .not.toBeInTheDocument();

    await userEvent.tab();

    await expect.element(screen.getByRole("combobox")).toHaveValue("Home");
    expect(router.state.location.pathname).toBe("/sets/set-1/boards/root");
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

    setCommunicationLanguage("es");

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

    setCommunicationLanguage("es");

    const { screen } = await renderSelector("set-2", "root");

    await expect
      .element(screen.getByRole("combobox"))
      .toHaveValue("constructor");
  });
});
