import { AppProviders } from "@shared/providers/app-providers";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { beforeEach, describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { replaceBoardSet } from "../storage/boards-db";
import { clearBoardsDB, makeOBFBoard } from "../storage/test-utils";
import { BoardSwitcher } from "./board-switcher";

beforeEach(async () => {
  await clearBoardsDB();
  await replaceBoardSet({
    boardSet: { setId: "set-1", name: "Set", rootBoardId: "root" },
    boards: [
      { boardId: "root", name: "Home", obf: makeOBFBoard({ id: "root" }) },
      {
        boardId: "animals",
        name: "Animals",
        obf: makeOBFBoard({ id: "animals" }),
      },
    ],
    assets: [],
  });
});

describe("BoardSwitcher", () => {
  test("opens the panel, selects a board, navigates and closes", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/sets/:setId/boards/:boardId",
          element: <BoardSwitcher label="Home" />,
        },
      ],
      { initialEntries: ["/sets/set-1/boards/root"] },
    );

    const screen = await render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    await expect
      .element(screen.getByRole("button", { name: "Home" }))
      .toBeInTheDocument();
    await screen.getByRole("button", { name: "Home" }).click();

    await expect
      .element(screen.getByRole("button", { name: "Animals" }))
      .toBeInTheDocument();
    await screen.getByRole("button", { name: "Animals" }).click();

    expect(router.state.location.pathname).toBe("/sets/set-1/boards/animals");
    await expect
      .element(screen.getByRole("button", { name: "Animals" }))
      .not.toBeInTheDocument();
  });
});
