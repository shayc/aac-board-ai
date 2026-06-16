import { resetBoardsDB, seedBoardSets } from "@features/board/testing";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { LibraryDrawer } from "./library-drawer";

describe("LibraryDrawer", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("shows the library title and closes via the close button, no a11y violations", async () => {
    const onClose = vi.fn();
    const router = createMemoryRouter(
      [{ path: "/", element: <LibraryDrawer open onClose={onClose} /> }],
      { initialEntries: ["/"] },
    );

    const screen = await render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    await expect
      .element(screen.getByText("Library", { exact: true }))
      .toBeInTheDocument();
    await expectNoA11yViolations(document.body);

    await screen.getByRole("button", { name: "Close library" }).click();
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("selecting a set navigates to it and closes the drawer", async () => {
    await seedBoardSets([
      { setId: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const onClose = vi.fn();
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <LibraryDrawer open onClose={onClose} variant="temporary" />,
        },
        { path: "/sets/:setId/boards/:boardId", element: <p>board page</p> },
      ],
      { initialEntries: ["/"] },
    );

    const screen = await render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    await screen.getByText("Animals").click();

    await expect.element(screen.getByText("board page")).toBeInTheDocument();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
