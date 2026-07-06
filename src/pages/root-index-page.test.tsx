import { appRoutes } from "@app/routing/app-routes";
import { getBoardSets } from "@features/board";
import {
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "@features/board/testing";
import { AppProviders } from "@shared/providers/app-providers";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";

const OBF_FIXTURE_URL =
  "/src/features/board/testing/sample-boards/lots-of-stuff.obf";

async function renderAt(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });

  const screen = await render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  const continueButton = screen.getByRole("button", { name: "Continue" });
  if (continueButton.query()) {
    await continueButton.click();
  }

  return screen;
}

describe("root index route", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("imports the ?board URL and opens the board", async () => {
    const screen = await renderAt(
      `/?board=${encodeURIComponent(OBF_FIXTURE_URL)}`,
    );

    await expect
      .element(screen.getByRole("grid", { name: "Lots of Stuff Board" }))
      .toBeVisible();

    expect(await getBoardSets()).toHaveLength(1);
  });

  test("re-visiting the same ?board URL dedups instead of importing again", async () => {
    const firstScreen = await renderAt(
      `/?board=${encodeURIComponent(OBF_FIXTURE_URL)}`,
    );
    await vi.waitFor(async () => {
      expect(await getBoardSets()).toHaveLength(1);
    });
    await firstScreen.unmount();

    const screen = await renderAt(
      `/?board=${encodeURIComponent(OBF_FIXTURE_URL)}`,
    );

    await expect
      .element(screen.getByRole("grid", { name: "Lots of Stuff Board" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Board already in your library");

    expect(await getBoardSets()).toHaveLength(1);
  });

  test("shows a localized error for an unsupported URL scheme, with a way back to an existing set", async () => {
    await seedBoardSets([
      {
        setId: "existing-set",
        rootBoardId: "root",
        boards: [
          {
            boardId: "root",
            name: "Home",
            obf: makeOBFBoard({ id: "root", name: "Home" }),
          },
        ],
      },
    ]);

    const screen = await renderAt(
      `/?board=${encodeURIComponent("data:text/plain;base64,Zm9v")}`,
    );

    await expect
      .element(screen.getByText("This link type can't be imported"))
      .toBeVisible();

    await screen.getByRole("button", { name: "Go to my boards" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Home" }))
      .toBeVisible();
  });

  test("shows a generic import-failed error and retries on request", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("not a valid board"));

    const screen = await renderAt(
      `/?board=${encodeURIComponent("https://example.com/broken.obz")}`,
    );

    await expect
      .element(screen.getByText("Couldn't import board"))
      .toBeVisible();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await screen.getByRole("button", { name: "Try again" }).click();

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  test("empty database: auto-imports the bundled starter board", async () => {
    const screen = await renderAt("/");

    await expect
      .element(screen.getByRole("grid", { name: "Quick Core 24" }))
      .toBeVisible();
  });
});
