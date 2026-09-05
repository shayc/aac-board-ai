import { CommunicationSessionProvider } from "@features/board";
import { makeOBFBoard, seedBoardSets } from "@features/board/testing";
import { BoardPage } from "@pages/board-page";
import { setStoredLanguage } from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import {
  createMemoryRouter,
  Outlet,
  type LoaderFunctionArgs,
} from "react-router";
import { RouterProvider } from "react-router/dom";
import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { boardLoader } from "./loaders/board-loader";

function SessionShell() {
  return (
    <CommunicationSessionProvider>
      <Outlet />
    </CommunicationSessionProvider>
  );
}

test("language changes update the board presentation without reloading its source", async () => {
  const obf = makeOBFBoard({
    id: "board",
    name: "Source",
    buttons: [{ id: "hello", label: "hello" }],
    grid: { rows: 1, columns: 1, order: [["hello"]] },
    strings: {
      es: { Source: "Origen", hello: "hola" },
      fr: { Source: "Source française", hello: "bonjour" },
    },
  });
  await seedBoardSets([
    {
      setId: "set",
      rootBoardId: "board",
      boards: [{ boardId: "board", name: "Source", obf }],
    },
  ]);
  setStoredLanguage("en");
  let loads = 0;
  const router = createMemoryRouter(
    [
      {
        Component: SessionShell,
        children: [
          {
            path: "/sets/:setId/boards/:boardId",
            Component: BoardPage,
            loader: (args: LoaderFunctionArgs) => {
              loads += 1;
              return boardLoader(args);
            },
            HydrateFallback: () => null,
          },
        ],
      },
    ],
    { initialEntries: ["/sets/set/boards/board"] },
  );
  const screen = await render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  await expect
    .element(screen.getByRole("button", { name: "hello", exact: true }))
    .toBeVisible();
  setStoredLanguage("es");
  await expect
    .element(screen.getByRole("button", { name: "hola", exact: true }))
    .toBeVisible();
  setStoredLanguage("fr");
  await expect
    .element(screen.getByRole("button", { name: "bonjour", exact: true }))
    .toBeVisible();
  expect(loads).toBe(1);
});
