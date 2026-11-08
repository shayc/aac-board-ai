import { importBoardFileFromURL, listBoardSets } from "@features/board";
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
  await screen.getByRole("button", { name: "Continue" }).click();

  return { router, screen };
}

function seedRecordedAudioSet() {
  const soundPath = "sounds/hello.wav";

  return seedBoardSets([
    {
      id: "recorded-set",
      rootBoardId: "home",
      boards: [
        makeOBFBoard({
          id: "home",
          name: "Home",
          buttons: [
            { id: "hello", label: "hello", sound_id: "hello-sound" },
            { id: "more", label: "more", load_board: { id: "next" } },
          ],
          grid: { rows: 1, columns: 2, order: [["hello", "more"]] },
          sounds: [
            { id: "hello-sound", path: soundPath, content_type: "audio/wav" },
          ],
        }),
        makeOBFBoard({ id: "next", name: "Next" }),
      ],
      assets: [{ path: soundPath, blob: new Blob(["recording"]) }],
    },
  ]);
}

// A set whose boardSetId collides with what the OBZ fixture URL derives.
function seedExistingLotsOfStuffSet() {
  return seedBoardSets([
    {
      id: "lots-of-stuff",
      rootBoardId: "root-1",
      boards: [makeOBFBoard({ id: "root-1", name: "Old Board" })],
    },
  ]);
}

describe("app flow", () => {
  let speech: ReturnType<typeof stubSpeech>;
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(async () => {
    speech = stubSpeech();
    audio = stubAudio();
    await resetBoardsDB();
  });

  test("first run: imported board set opens, composes across boards, and speaks", async () => {
    await importBoardFileFromURL(OBZ_FIXTURE_URL);

    const { screen } = await renderApp();

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

  test("recorded audio stays playable after leaving its board", async () => {
    await seedRecordedAudioSet();

    const { screen } = await renderApp();

    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "more" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Next" }))
      .toBeVisible();

    audio.play.mockClear();
    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(audio.play).toHaveBeenCalledTimes(1);
    });

    const [element] = audio.play.mock.contexts as HTMLAudioElement[];
    const response = await fetch(element.src);

    expect(await response.text()).toBe("recording");
  });

  test("empty database: imports and opens the bundled starter board", async () => {
    const { screen } = await renderApp();

    await expect
      .element(screen.getByRole("grid", { name: "First Words" }))
      .toBeVisible();
  });

  test("starter board: a sentence continues into the food folder", async () => {
    const { screen } = await renderApp();

    await screen.getByRole("button", { name: "I", exact: true }).click();
    await screen.getByRole("button", { name: "want" }).click();
    await screen.getByRole("button", { name: "food" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Food" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "water" }).click();
    speech.speak.mockClear();

    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(speech.speak.mock.calls).toHaveLength(1);
      expect(speech.speak.mock.calls[0][0].text).toBe("i want water");
    });
  });

  test("?board= link that collides with an existing set keeps both", async () => {
    await seedExistingLotsOfStuffSet();

    const { screen } = await renderApp(
      `/?board=${encodeURIComponent(OBZ_FIXTURE_URL)}`,
    );

    await expect
      .element(screen.getByRole("grid", { name: "Lots of Stuff Board" }))
      .toBeVisible();

    expect(new Set((await listBoardSets()).map((set) => set.id))).toEqual(
      new Set(["lots-of-stuff", "lots-of-stuff-2"]),
    );
  });

  test("deleting the active board set opens the remaining one", async () => {
    await seedBoardSets([
      {
        id: "animals",
        rootBoardId: "home",
        name: "Animals",
        boards: [makeOBFBoard({ id: "home", name: "Animals Home" })],
      },
      {
        id: "zoo",
        rootBoardId: "home",
        name: "Zoo",
        boards: [makeOBFBoard({ id: "home", name: "Zoo Home" })],
      },
    ]);

    const { router, screen } = await renderApp("/sets/animals/boards/home");

    await expect
      .element(screen.getByRole("grid", { name: "Animals Home" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "Open library" }).click();
    await screen
      .getByRole("button", { name: "More options for Animals" })
      .click();
    await screen.getByRole("menuitem", { name: "Delete" }).click();
    await screen.getByRole("button", { name: "Delete" }).click();

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe("/sets/zoo/boards/home");
    });
    await screen.getByRole("button", { name: "Close library" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Zoo Home" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("grid", { name: "Animals Home" }))
      .not.toBeInTheDocument();
  });

  test("client navigation from a board sets the localized not-found title", async () => {
    const { router, screen } = await renderApp();

    await expect
      .element(screen.getByRole("grid", { name: "First Words" }))
      .toBeVisible();
    expect(document.title).toBe("First Words");

    await router.navigate("/nonexistent");

    await expect.element(screen.getByText("Page not found")).toBeVisible();
    expect(document.title).toBe("Page not found");
    await expect
      .element(screen.getByRole("link", { name: "Go home" }))
      .toHaveAttribute("href", "/");
  });
});
