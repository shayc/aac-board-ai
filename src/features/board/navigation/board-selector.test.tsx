import {
  DEFAULT_LANGUAGE,
  setStoredLanguage,
} from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { beforeEach, describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import type { BoardSummary } from "./board-summaries";
import { BoardSelector } from "./board-selector";

const BOARDS: BoardSummary[] = [
  { boardId: "animals", name: "Animals" },
  { boardId: "food", name: "Food" },
  { boardId: "root", name: "Home" },
];

async function renderSelector(
  initialPath: string,
  boards: BoardSummary[] = BOARDS,
) {
  const router = createMemoryRouter(
    [
      {
        path: "/sets/:setId/boards/:boardId",
        element: <BoardSelector boards={boards} />,
      },
    ],
    { initialEntries: [initialPath] },
  );

  const screen = await render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  return { router, screen };
}

beforeEach(() => {
  setStoredLanguage(DEFAULT_LANGUAGE);
});

describe("BoardSelector", () => {
  test("shows the current board name in the input", async () => {
    const { screen } = await renderSelector("/sets/set-1/boards/root");

    await expect.element(screen.getByRole("combobox")).toHaveValue("Home");
  });

  test("opens the popup with boards listed alphabetically and the current board selected", async () => {
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

  test("renders names exactly as provided by route data", async () => {
    const { screen } = await renderSelector("/sets/set-1/boards/root", [
      { boardId: "root", name: "Inicio" },
      { boardId: "animals", name: "Animales" },
    ]);

    await expect.element(screen.getByRole("combobox")).toHaveValue("Inicio");

    await screen.getByRole("combobox").click();
    await expect
      .element(screen.getByRole("option", { name: "Animales" }))
      .toBeInTheDocument();
  });
});
