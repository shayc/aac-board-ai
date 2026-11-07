import { resetBoardsDB, seedBoardSets } from "@features/board/testing";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { LibraryDrawer } from "./library-drawer";

describe("LibraryDrawer", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  async function renderOpenDrawer(onClose = vi.fn()) {
    const router = createMemoryRouter(
      [{ path: "/", element: <LibraryDrawer open onClose={onClose} /> }],
      { initialEntries: ["/"] },
    );

    return render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );
  }

  test("shows the library title with no accessibility violations", async () => {
    const screen = await renderOpenDrawer();

    await expect
      .element(screen.getByText("Library", { exact: true }))
      .toBeInTheDocument();
    await expectNoA11yViolations(document.body);
  });

  test("closes via the close button", async () => {
    const onClose = vi.fn();
    const screen = await renderOpenDrawer(onClose);

    await screen.getByRole("button", { name: "Close library" }).click();

    expect(onClose).toHaveBeenCalledOnce();
  });

  test("navigates and keeps the drawer open when a board link is activated", async () => {
    await seedBoardSets([
      { id: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const onClose = vi.fn();
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <LibraryDrawer open onClose={onClose} />,
        },
        {
          path: "/sets/:boardSetId/boards/:boardId",
          element: <p>board page</p>,
        },
      ],
      { initialEntries: ["/"] },
    );

    const screen = await render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    const link = screen.getByRole("link", { name: "Animals", exact: true });
    await expect
      .element(link)
      .toHaveAttribute("href", "/sets/animals/boards/root");

    link.element().focus();
    await userEvent.keyboard("{Enter}");

    await expect.element(screen.getByText("board page")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/sets/animals/boards/root");
    expect(onClose).not.toHaveBeenCalled();
  });
});
