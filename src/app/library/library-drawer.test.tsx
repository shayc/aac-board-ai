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

  test.each(["temporary", "persistent"] as const)(
    "activating a board link navigates and only closes a temporary drawer (%s)",
    async (variant) => {
      await seedBoardSets([
        { id: "animals", rootBoardId: "root", name: "Animals" },
      ]);

      const onClose = vi.fn();
      const router = createMemoryRouter(
        [
          {
            path: "/",
            element: <LibraryDrawer open onClose={onClose} variant={variant} />,
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

      const link = screen.getByRole("link", { name: "Animals", exact: true });
      await expect
        .element(link)
        .toHaveAttribute("href", "/sets/animals/boards/root");

      if (variant === "temporary") {
        link.element().focus();
        await userEvent.keyboard("{Enter}");
      } else {
        await link.click();
      }

      await expect.element(screen.getByText("board page")).toBeInTheDocument();
      expect(router.state.location.pathname).toBe("/sets/animals/boards/root");
      expect(onClose).toHaveBeenCalledTimes(variant === "temporary" ? 1 : 0);
    },
  );

  test("modified clicks keep the temporary drawer and current route open", async () => {
    await seedBoardSets([
      { id: "animals", rootBoardId: "root", name: "Animals" },
    ]);

    const onClose = vi.fn();
    const router = createMemoryRouter([
      {
        path: "/",
        element: <LibraryDrawer open onClose={onClose} variant="temporary" />,
      },
    ]);
    const screen = await render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );
    const link = screen.getByRole("link", { name: "Animals", exact: true });

    await link.click({ modifiers: ["ControlOrMeta"] });

    expect(router.state.location.pathname).toBe("/");
    expect(onClose).not.toHaveBeenCalled();
    await expect.element(link).toBeVisible();
  });

  test("exposes a complementary landmark when persistent, no a11y violations", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: (
            <LibraryDrawer open onClose={vi.fn()} variant="persistent" />
          ),
        },
      ],
      { initialEntries: ["/"] },
    );

    const screen = await render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    await expect
      .element(screen.getByRole("complementary", { name: "Library" }))
      .toBeInTheDocument();
    await expectNoA11yViolations(document.body);
  });
});
