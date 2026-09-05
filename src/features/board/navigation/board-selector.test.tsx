import {
  DEFAULT_LANGUAGE,
  setStoredLanguage,
} from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { createMemoryRouter, useLoaderData } from "react-router";
import { RouterProvider } from "react-router/dom";
import { beforeEach, describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { resetBoardsDB } from "../testing";
import type { BoardSummary } from "../translation/board-translations";
import { BoardSelector } from "./board-selector";

const BOARD_SUMMARIES: BoardSummary[] = [
  { boardId: "animals", name: "Animals", nameLanguage: "en" },
  { boardId: "food", name: "Food", nameLanguage: "en" },
  { boardId: "root", name: "Home", nameLanguage: "en" },
];

function SelectorRoute() {
  const summaries = useLoaderData<BoardSummary[]>();
  return <BoardSelector boards={summaries} />;
}

async function renderSelector(
  initialPath: string,
  initialSummaries = BOARD_SUMMARIES,
) {
  let currentSummaries = initialSummaries;
  const router = createMemoryRouter(
    [
      {
        path: "/sets/:setId/boards/:boardId",
        Component: SelectorRoute,
        loader: () => currentSummaries,
      },
    ],
    { initialEntries: [initialPath] },
  );

  const screen = await render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  function updateBoards(summaries: BoardSummary[]) {
    currentSummaries = summaries;
    return router.revalidate();
  }

  return { router, screen, updateBoards };
}

beforeEach(async () => {
  setStoredLanguage(DEFAULT_LANGUAGE);
  await resetBoardsDB();
});

describe("BoardSelector", () => {
  test("keeps a filtered keyboard target while new names arrive, including duplicate names", async () => {
    const { router, screen, updateBoards } = await renderSelector(
      "/sets/set-1/boards/root",
    );
    await screen.getByRole("combobox").fill("ani");
    await expect
      .element(screen.getByRole("option", { name: "Animals" }))
      .toBeVisible();

    setStoredLanguage("es");
    await updateBoards(
      BOARD_SUMMARIES.map((summary) => ({
        ...summary,
        name: "Igual",
        nameLanguage: "es",
      })),
    );

    await expect.element(screen.getByRole("combobox")).toHaveValue("ani");
    await expect
      .element(screen.getByRole("option", { name: "Animals" }))
      .toBeVisible();
    await userEvent.keyboard("{Enter}");
    await expect
      .poll(() => router.state.location.pathname)
      .toBe("/sets/set-1/boards/animals");
    await expect.element(screen.getByRole("combobox")).toHaveValue("Igual");
    await screen.getByRole("combobox").click();
    await expect
      .element(screen.getByRole("option").first())
      .toHaveAttribute("aria-selected", "true");
    await expect
      .element(screen.getByRole("option").nth(1))
      .toHaveAttribute("aria-selected", "false");
  });
  test("opens the popup in the supplied order with the current board selected", async () => {
    const { screen } = await renderSelector("/sets/set-1/boards/root");

    await screen.getByRole("combobox").click();

    const items = screen.getByRole("option");
    await expect.element(items.first()).toHaveTextContent("Animals");
    await expect.element(items.nth(1)).toHaveTextContent("Food");
    await expect.element(items.nth(2)).toHaveTextContent("Home");
    await expect
      .element(screen.getByRole("option", { name: "Home" }))
      .toHaveAttribute("aria-selected", "true");

    // "region" flags the portaled popup for not being inside a landmark,
    // which only exists in the full app shell, not this isolated component
    // render.
    await expectNoA11yViolations(document.body, {
      rules: { region: { enabled: false } },
    });
  });

  test("navigates and closes the popup when a board is clicked", async () => {
    const { router, screen } = await renderSelector("/sets/set-1/boards/root");

    await screen.getByRole("combobox").click();
    await screen.getByRole("option", { name: "Animals" }).click();

    expect(router.state.location.pathname).toBe("/sets/set-1/boards/animals");
    await expect
      .element(screen.getByRole("option", { name: "Animals" }))
      .not.toBeInTheDocument();
    await expect.element(screen.getByRole("combobox")).toHaveValue("Animals");
  });

  test("navigates with arrow keys and Enter", async () => {
    const { router, screen } = await renderSelector("/sets/set-1/boards/root");

    await screen.getByRole("combobox").click();
    await userEvent.keyboard("{ArrowDown}{Enter}");

    expect(router.state.location.pathname).toBe("/sets/set-1/boards/animals");
  });

  test("filters while typing and selects the first match with Enter", async () => {
    const { router, screen } = await renderSelector("/sets/set-1/boards/root");

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

  test("closes the popup on Escape and restores the current board name on blur", async () => {
    const { router, screen } = await renderSelector("/sets/set-1/boards/root");

    await screen.getByRole("combobox").fill("ani");
    await userEvent.keyboard("{Escape}");

    await expect
      .element(screen.getByRole("option", { name: "Animals" }))
      .not.toBeInTheDocument();

    await userEvent.tab();

    await expect.element(screen.getByRole("combobox")).toHaveValue("Home");
    expect(router.state.location.pathname).toBe("/sets/set-1/boards/root");
  });

  test("displays supplied translated and fallback names with their languages", async () => {
    setStoredLanguage("es");

    const { screen } = await renderSelector("/sets/set-2/boards/root", [
      { boardId: "animals", name: "Animals", nameLanguage: "en" },
      { boardId: "root", name: "Inicio", nameLanguage: "es" },
    ]);

    await expect.element(screen.getByRole("combobox")).toHaveValue("Inicio");
    await expect
      .element(screen.getByRole("combobox"))
      .toHaveAttribute("lang", "es");

    await screen.getByRole("combobox").click();
    await expect
      .element(screen.getByRole("option", { name: "Animals" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Animals", { exact: true }))
      .toHaveAttribute("lang", "en");
  });

  test("keeps the UI label language separate from a fallback board name during language changes", async () => {
    const { screen } = await renderSelector("/sets/set-1/boards/root");
    await expect
      .element(screen.getByRole("combobox", { name: "Board" }))
      .toHaveValue("Home");

    setStoredLanguage("es");
    const selector = screen.getByRole("combobox", { name: "Tablero" });
    await expect.element(selector).toHaveValue("Home");
    await expect.element(selector).toHaveAttribute("lang", "en");

    const labelId = selector.element().getAttribute("aria-labelledby") ?? "";
    const label = document.getElementById(labelId);
    await expect.element(label).toHaveTextContent("Tablero");
    await expect.element(label).toHaveAttribute("lang", "es");

    await selector.click();
    await screen.getByRole("option", { name: "Animals" }).click();
    await expect.element(selector).toHaveValue("Animals");
    await expect.element(selector).toHaveAttribute("lang", "en");
    await expect.element(label).toHaveAttribute("lang", "es");

    setStoredLanguage("es-MX");
    await expect
      .element(screen.getByRole("combobox", { name: "Board" }))
      .toHaveValue("Animals");
    await expect.element(label).toHaveTextContent("Board");
    await expect.element(label).toHaveAttribute("lang", "en");
  });
});
