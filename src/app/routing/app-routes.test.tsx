import { listBoardSets, importBoardSetFromUrl } from "@features/board";
import {
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "@features/board/testing";
import { AppProviders } from "@shared/providers/app-providers";
import { stubAudio } from "@shared/testing/stub-audio";
import { expectNoA11yViolations } from "@shared/testing/axe";
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

async function renderBoardLink(boardUrl: string) {
  const app = await renderApp(`/?board=${encodeURIComponent(boardUrl)}`);
  await app.screen.getByRole("button", { name: "Continue" }).click();

  return app;
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

describe("app flow", () => {
  let speech: ReturnType<typeof stubSpeech>;
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(async () => {
    speech = stubSpeech();
    audio = stubAudio();
    await resetBoardsDB();
  });

  test("first run: imported board set opens, composes across boards, and speaks", async () => {
    await importBoardSetFromUrl(OBZ_FIXTURE_URL);

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

  test("recorded audio stays playable after leaving its board", async () => {
    await seedRecordedAudioSet();

    const { screen } = await renderApp();

    await screen.getByRole("button", { name: "Continue" }).click();
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

    await screen.getByRole("button", { name: "Continue" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Quick Core 24" }))
      .toBeVisible();
  });

  test("?board= link asks first, then adds the set beside a colliding one", async () => {
    await seedExistingLotsOfStuffSet();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { router, screen } = await renderBoardLink(OBZ_FIXTURE_URL);

    await expect
      .element(screen.getByRole("dialog", { name: "Add this board set?" }))
      .toBeVisible();
    await expect
      .element(screen.getByText(`From ${window.location.host}`))
      .toBeVisible();
    expect(fetchSpy).not.toHaveBeenCalled();

    await screen.getByRole("button", { name: "Add", exact: true }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Lots of Stuff Board" }))
      .toBeVisible();
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    expect(router.state.location.search).toBe("");
    expect(new Set((await listBoardSets()).map((set) => set.id))).toEqual(
      new Set(["lots-of-stuff", "lots-of-stuff-2"]),
    );
  });

  test("the ?board= prompt has no accessibility violations", async () => {
    await seedExistingLotsOfStuffSet();

    const { screen } = await renderBoardLink(OBZ_FIXTURE_URL);
    const dialog = screen.getByRole("dialog", { name: "Add this board set?" });
    await expect.element(dialog).toBeVisible();

    // Axe would otherwise measure contrast partway through the dialog's fade.
    await Promise.allSettled(
      document.getAnimations().map((animation) => animation.finished),
    );

    await expectNoA11yViolations(dialog.element());
  });

  test("declining a ?board= link keeps the current board and stores nothing", async () => {
    await seedExistingLotsOfStuffSet();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { router, screen } = await renderBoardLink(OBZ_FIXTURE_URL);

    await screen.getByRole("button", { name: "Cancel" }).click();

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("grid", { name: "Old Board" }))
      .toBeVisible();
    expect(router.state.location.search).toBe("");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await listBoardSets()).toHaveLength(1);
  });

  test("a failed ?board= import keeps the current board and can be retried", async () => {
    await seedExistingLotsOfStuffSet();

    const { screen } = await renderBoardLink(OBZ_FIXTURE_URL);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 404 }),
    );
    await screen.getByRole("button", { name: "Add", exact: true }).click();

    await expect
      .element(screen.getByText("Couldn't import board file from link"))
      .toBeVisible();
    expect(await listBoardSets()).toHaveLength(1);

    await screen.getByRole("button", { name: "Try again" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Lots of Stuff Board" }))
      .toBeVisible();
  });

  test("canceling a ?board= download aborts it and stores nothing", async () => {
    await seedExistingLotsOfStuffSet();

    const { screen } = await renderBoardLink(OBZ_FIXTURE_URL);

    const { promise: fetchStarted, resolve: markFetchStarted } =
      Promise.withResolvers<AbortSignal>();
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      const signal = init?.signal;
      if (!signal) {
        throw new Error("Expected the board download to be abortable");
      }

      markFetchStarted(signal);

      return new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason));
      });
    });

    await screen.getByRole("button", { name: "Add", exact: true }).click();
    const signal = await fetchStarted;
    await screen.getByRole("button", { name: "Cancel" }).click();

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    expect(signal.aborted).toBe(true);
    expect(await listBoardSets()).toHaveLength(1);
  });

  test("a non-http(s) ?board= link fails without offering to add it", async () => {
    await seedExistingLotsOfStuffSet();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { screen } = await renderBoardLink(
      "data:application/zip;base64,UEsDBA==",
    );

    await expect
      .element(screen.getByText("Couldn't import board file from link"))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Add", exact: true }))
      .not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();

    await screen.getByRole("button", { name: "Close" }).click();

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });

  test("the ?board= prompt waits for onboarding", async () => {
    await seedExistingLotsOfStuffSet();

    const { screen } = await renderApp(
      `/?board=${encodeURIComponent(OBZ_FIXTURE_URL)}`,
    );

    await expect
      .element(screen.getByRole("button", { name: "Continue" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("dialog", { name: "Add this board set?" }))
      .not.toBeInTheDocument();
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
