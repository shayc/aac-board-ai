import { getBoardSets, importBoardFromUrl } from "@features/board";
import {
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "@features/board/testing";
import { AppProviders } from "@shared/providers/app-providers";
import { stubAudio } from "@shared/testing/stub-audio";
import { stubSpeech } from "@shared/testing/stub-speech";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { appRoutes } from "./app-routes";

const OBZ_FIXTURE_URL =
  "/src/features/board/testing/sample-boards/lots-of-stuff.obz";

async function renderApp(initialEntry = "/") {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialEntry],
  });

  const screen = await render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  return { router, screen };
}

describe("app flow", () => {
  let speech: ReturnType<typeof stubSpeech>;

  beforeEach(async () => {
    speech = stubSpeech();
    stubAudio();
    await resetBoardsDB();
  });

  test("first run: imported board set opens, composes across boards, and speaks", async () => {
    await importBoardFromUrl(OBZ_FIXTURE_URL);

    const { screen } = await renderApp();

    await screen.getByRole("button", { name: "Continue" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Lots of Stuff Board" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "No way" }).click();
    await screen.getByRole("button", { name: "living things" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Inline Images Board" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "cat" }).click();
    // Tile taps speak per-tile feedback; only the played message is asserted.
    speech.speak.mockClear();

    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(speech.speak.mock.calls).toHaveLength(1);
      expect(speech.speak.mock.calls[0][0].text).toBe("no way feline");
    });
  });

  test("empty database: imports and opens the bundled starter board", async () => {
    const { screen } = await renderApp();

    await screen.getByRole("button", { name: "Continue" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Quick Core 24" }))
      .toBeVisible();
  });

  test("?board= link that collides with an existing set keeps both", async () => {
    await seedExistingLotsOfStuffSet();

    const { screen } = await renderApp(
      `/?board=${encodeURIComponent(OBZ_FIXTURE_URL)}`,
    );

    await screen.getByRole("button", { name: "Continue" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Lots of Stuff Board" }))
      .toBeVisible();

    expect(new Set((await getBoardSets()).map((set) => set.setId))).toEqual(
      new Set(["lots-of-stuff", "lots-of-stuff-2"]),
    );
  });

  test("client navigation from a board sets the localized not-found title", async () => {
    const { router, screen } = await renderApp();

    await screen.getByRole("button", { name: "Continue" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Quick Core 24" }))
      .toBeVisible();
    expect(document.title).toBe("Quick Core 24");

    await router.navigate("/nonexistent");

    await expect.element(screen.getByText("Page not found")).toBeVisible();
    expect(document.title).toBe("Page not found");
    await expect
      .element(screen.getByRole("link", { name: "Go home" }))
      .toHaveAttribute("href", "/");
  });
});

// A set whose setId collides with what the OBZ fixture URL derives.
function seedExistingLotsOfStuffSet() {
  return seedBoardSets([
    {
      setId: "lots-of-stuff",
      rootBoardId: "root-1",
      boards: [
        {
          boardId: "root-1",
          name: "Old Board",
          obf: makeOBFBoard({ id: "root-1", name: "Old Board" }),
        },
      ],
    },
  ]);
}
